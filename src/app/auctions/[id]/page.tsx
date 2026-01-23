'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api, Auction, BidLog, MemberInfo } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';
import DepositModal from '@/components/DepositModal';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/api/utils';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export default function AuctionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const auctionId = Number(params.id);
    const { isLoggedIn, accessToken } = useAuthStore();

    const [auction, setAuction] = useState<Auction | null>(null);
    const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [bidding, setBidding] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    // 경매 데이터 및 사용자 정보 로드
    useEffect(() => {
        async function loadData() {
            try {
                // 경매 정보 및 입찰 기록 병렬 요청
                const promises: Promise<unknown>[] = [
                    api.getAuction(auctionId).then(setAuction),
                    api.getBidLogs(auctionId).then(setBidLogs)
                ];

                // 로그인 시 사용자 정보 조회
                if (accessToken) {
                    promises.push(api.getMe().then(setMemberInfo).catch(() => setMemberInfo(null)));
                }

                await Promise.allSettled(promises);
            } catch (error) {
                console.error("Failed to load auction data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [auctionId, accessToken]);

    // SSE 실시간 구독
    useEffect(() => {
        if (!auction || auction.status !== 'IN_PROGRESS') return;

        const connect = () => {
            setConnectionStatus('connecting');
            const url = api.getAuctionSubscribeUrl(auctionId);

            try {
                const eventSource = new EventSource(url);
                eventSourceRef.current = eventSource;

                eventSource.onopen = () => {
                    console.log('SSE 연결 성공');
                    setConnectionStatus('connected');
                    setLastUpdate(new Date());
                };

                // 최초 연결 이벤트
                eventSource.addEventListener('connect', (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('SSE Connect:', data);
                        // 연결 시점의 최신 가격 동기화
                        if (data.currentPrice) {
                            setAuction(prev => prev ? { ...prev, currentPrice: data.currentPrice } : null);
                        }
                    } catch (e) {
                        console.error('SSE Connect Parse Error', e);
                    }
                });

                // 실시간 업데이트 처리 핸들러
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const handleUpdate = (data: any) => {
                    setLastUpdate(new Date());

                    // 입찰/가격 업데이트
                    if (data.bidAmount || data.currentPrice) {
                        const newPrice = data.bidAmount || data.currentPrice;
                        setAuction(prev => prev ? {
                            ...prev,
                            currentPrice: newPrice,
                            bidCount: (prev.bidCount || 0) + 1
                        } : null);

                        // 입찰 기록 업데이트: SSE에서 bidderName(닉네임)을 받아와서 처리
                        if (data.bidAmount && (data.bidderName || data.publicId)) {
                            const newLog: BidLog = {
                                id: Date.now(), // 임시 ID
                                publicId: data.bidderName || data.publicId, // 닉네임 우선 사용
                                bidAmount: data.bidAmount,
                                bidTime: new Date().toISOString()
                            };
                            setBidLogs(prev => [newLog, ...prev]);
                        } else if (data.bidAmount) {
                            // 데이터 부족 시 재조회 (fallback)
                            api.getBidLogs(auctionId).then(setBidLogs).catch(e => console.error('입찰 기록 갱신 실패', e));
                        }
                    }

                    // 경매 종료 이벤트
                    if (data.type === 'ENDED' || data.status === 'ENDED') {
                        setAuction(prev => prev ? { ...prev, status: 'ENDED' } : null);
                        eventSource.close();
                        setConnectionStatus('disconnected');
                    }
                };

                // 이벤트 리스너 등록 (bid 이벤트 및 일반 메시지)
                eventSource.addEventListener('bid', (event) => {
                    try {
                        handleUpdate(JSON.parse(event.data));
                    } catch (e) { console.error(e); }
                });

                eventSource.onmessage = (event) => {
                    try {
                        handleUpdate(JSON.parse(event.data));
                    } catch (e) { console.error(e); }
                };

                eventSource.onerror = () => {
                    console.log('SSE 연결 종료 - 서버 미연결 또는 경매 종료');
                    setConnectionStatus('disconnected');
                    eventSource.close();

                    // 10초 후 재연결 시도
                    setTimeout(() => {
                        if (auction?.status === 'IN_PROGRESS') {
                            connect();
                        }
                    }, 10000);
                };
            } catch {
                console.log('SSE 연결 시도 실패 - BE 서버 확인 필요');
                setConnectionStatus('disconnected');
            }
        };

        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionId, auction?.status]);

    const executeBid = async (amount: number) => {
        setBidding(true);
        try {
            await api.createBid(auctionId, amount);
            setBidAmount('');
            alert('입찰이 완료되었습니다!');
            // 성공 시 내가 참여했음을 로컬 상태 업데이트 (모달 다시 안 뜨게)
            setAuction(prev => prev ? { ...prev, myParticipation: { ...prev.myParticipation, hasBid: true } } : null);
        } catch (error) {
            const message = getErrorMessage(error, '입찰에 실패했습니다.');
            alert(message);
        } finally {
            setBidding(false);
            setShowDepositModal(false);
            setPendingBidAmount(null);
        }
    };

    const handleBidClick = async () => {
        // 1. 로그인 체크
        if (!isLoggedIn) {
            if (confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
                router.push('/login');
            }
            return;
        }

        // 2. 본인 인증 체크
        if (!api.isVerified(memberInfo)) {
            setShowVerifyModal(true);
            return;
        }

        // 3. API 데이터 유효성 체크
        if (!bidAmount || !auction) return;
        const amount = Number(bidAmount);

        if (amount <= auction.currentPrice) {
            alert('현재가보다 높은 금액을 입력해주세요');
            return;
        }

        // 4. 첫 입찰 여부 확인
        const hasBid = auction.myParticipation?.hasBid;

        if (!hasBid) {
            // 첫 입찰이면 보증금 모달 띄우기
            setPendingBidAmount(amount);
            setShowDepositModal(true);
        } else {
            // 재입찰이면 바로 실행
            executeBid(amount);
        }
    };

    // 인증 완료 후 콜백
    const handleVerified = async () => {
        try {
            const me = await api.getMe();
            setMemberInfo(me);
        } catch {
            // ignore
        }
    };

    // 연결 상태 표시 컴포넌트
    const ConnectionIndicator = () => {
        const statusConfig = {
            connecting: { color: 'bg-yellow-400', text: '연결 중...', animate: true },
            connected: { color: 'bg-green-500', text: '실시간 연결됨', animate: true },
            disconnected: { color: 'bg-gray-500', text: '연결 안됨', animate: false },
            error: { color: 'bg-red-500', text: '연결 오류', animate: false },
        };
        const config = statusConfig[connectionStatus];

        return (
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className={`w-2 h-2 rounded-full ${config.color} ${config.animate ? 'animate-pulse' : ''}`}></span>
                <span>{config.text}</span>
                {lastUpdate && connectionStatus === 'connected' && (
                    <span className="text-gray-600">• {lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">로딩 중...</p>
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 mb-4">경매를 찾을 수 없습니다</p>
                <Link href="/" className="text-[var(--lego-yellow)] hover:underline">← 돌아가기</Link>
            </div>
        );
    }

    const deposit = api.calculateDeposit(auction.startPrice);
    // 내 입찰 가능 여부 (판매자 본인 여부 등은 백엔드에서 전달된 canBid로 판단)
    // bid 객체가 없거나 canBid가 false이면 입찰 불가
    const canBid = auction.bid?.canBid ?? false; // Default true if legacy? Or should default false. Schema has optional.

    return (
        <div className="max-w-5xl mx-auto">
            <Link href="/" className="text-gray-400 hover:text-white transition text-sm mb-6 inline-block">
                ← 목록으로
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Image */}
                <div>
                    <div className="card overflow-hidden mb-4">
                        <div className="h-80 bg-[#222]">
                            {auction.imageUrl ? (
                                <Image src={auction.imageUrl} alt="" width={400} height={320} className="w-full h-full object-cover" />

                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">🧱</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card p-5">
                        <h2 className="font-semibold mb-3">상품 설명</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">{auction.productDescription}</p>
                    </div>
                </div>

                {/* Right: Info & Bid */}
                <div>
                    <div className="card p-5 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {auction.status === 'IN_PROGRESS' && (
                                    <span className="badge badge-live">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                                <span className="text-gray-500 text-sm">{(auction.bidCount || 0)}회 입찰</span>
                            </div>
                            {auction.status === 'IN_PROGRESS' && <ConnectionIndicator />}
                        </div>

                        <h1 className="text-xl font-semibold mb-4">{auction.productName}</h1>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-[#111] rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">시작가</p>
                                <p className="font-semibold text-gray-400">₩{formatPrice(auction.startPrice)}</p>
                            </div>
                            <div className="bg-[#111] rounded-lg p-3 border border-[var(--lego-yellow)]/30">
                                <p className="text-xs text-[var(--lego-yellow)] mb-1">현재가</p>
                                <p className="text-xl font-bold text-[var(--lego-yellow)]">₩{formatPrice(auction.currentPrice)}</p>
                            </div>
                        </div>

                        {/* 보증금 안내 */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                            <p className="text-blue-400 text-xs">
                                💰 입찰 보증금: <span className="font-bold">₩{formatPrice(deposit)}</span> (시작가의 10%)
                                {!auction.myParticipation?.hasBid && <span className="block mt-1 text-[11px] opacity-70">* 첫 입찰 시에만 부과됩니다.</span>}
                            </p>
                        </div>

                        {auction.status === 'IN_PROGRESS' && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-gray-400">입찰 금액 선택</label>
                                    <span className="text-xs text-gray-500">
                                        호가 단위: ₩{formatPrice(api.getBidIncrement(auction.currentPrice))}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {api.getBidOptions(auction.currentPrice).map((amount, i) => (
                                        <button
                                            key={amount}
                                            onClick={() => setBidAmount(String(amount))}
                                            disabled={!canBid}
                                            className={`py-3 rounded-lg text-sm font-medium transition ${bidAmount === String(amount)
                                                ? 'bg-yellow-500 text-black'
                                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                                } ${!canBid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            ₩{formatPrice(amount)}
                                            {i === 0 && <span className="block text-xs opacity-70">최소</span>}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleBidClick}
                                    disabled={bidding || !bidAmount || !canBid}
                                    className="w-full lego-btn py-3 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bidding ? '입찰 중...' :
                                        !canBid ? '입찰 불가 (본인 상품 또는 자격 제한)' :
                                            `₩${bidAmount ? formatPrice(Number(bidAmount)) : '금액 선택'} 입찰하기`}
                                </button>
                            </div>
                        )}

                        <div className="text-sm text-gray-500 flex gap-4">
                            <span>시작: {formatDate(auction.startTime)}</span>
                            <span>종료: {formatDate(auction.endTime)}</span>
                        </div>
                    </div>

                    {/* Bid History */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">입찰 기록</h2>
                            {auction.status === 'IN_PROGRESS' && connectionStatus === 'connected' && (
                                <span className="text-xs text-green-400">🔴 실시간 업데이트</span>
                            )}
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {bidLogs.map((log, i) => (
                                <div key={log.id} className={`flex justify-between items-center p-3 rounded-lg transition-all ${i === 0 ? 'bg-[var(--lego-yellow)]/10 border border-[var(--lego-yellow)]/20' : 'bg-[#111]'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded text-xs flex items-center justify-center font-semibold ${i === 0 ? 'bg-[var(--lego-yellow)] text-black' : 'bg-[#333] text-gray-400'}`}>
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className={`font-medium text-sm ${i === 0 ? 'text-[var(--lego-yellow)]' : 'text-white'}`}>{log.publicId}</p>
                                            <p className="text-xs text-gray-500">{formatDate(log.bidTime)}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold ${i === 0 ? 'text-[var(--lego-yellow)]' : 'text-gray-300'}`}>
                                        ₩{formatPrice(log.bidAmount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 본인인증 모달 */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={handleVerified}
            />

            {/* 보증금 결제 모달 */}
            <DepositModal
                isOpen={showDepositModal}
                depositAmount={deposit}
                onClose={() => {
                    setShowDepositModal(false);
                    setPendingBidAmount(null);
                }}
                onConfirm={() => {
                    if (pendingBidAmount) executeBid(pendingBidAmount);
                }}
                loading={bidding}
            />
        </div>
    );
}
