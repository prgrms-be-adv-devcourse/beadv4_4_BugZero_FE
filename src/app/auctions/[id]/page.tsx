'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Auction, BidLog, MemberInfo } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';


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
    const auctionId = Number(params.id);

    const [auction, setAuction] = useState<Auction | null>(null);
    const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [bidding, setBidding] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);


    const eventSourceRef = useRef<EventSource | null>(null);

    // 경매 데이터 로드
    useEffect(() => {
        async function loadData() {
            try {
                const data = await api.getAuction(auctionId);
                setAuction(data);
                const logs = await api.getBidLogs(auctionId);
                setBidLogs(logs);
            } catch (error) {
                console.error("Failed to load auction data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [auctionId]);

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

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('SSE 메시지 수신:', data);
                        setLastUpdate(new Date());

                        // 새 입찰 이벤트 처리
                        if (data.type === 'BID' || data.bidAmount) {
                            setAuction(prev => prev ? {
                                ...prev,
                                currentPrice: data.currentPrice || data.bidAmount,
                                bidCount: (prev.bidCount || 0) + 1
                            } : null);

                            // 입찰 기록에 추가
                            if (data.publicId) {
                                setBidLogs(prev => [{
                                    id: Date.now(),
                                    publicId: data.publicId,
                                    bidAmount: data.bidAmount || data.currentPrice,
                                    bidTime: new Date().toISOString()
                                }, ...prev]);
                            }
                        }

                        // 경매 종료 이벤트
                        if (data.type === 'ENDED' || data.status === 'ENDED') {
                            setAuction(prev => prev ? { ...prev, status: 'ENDED' } : null);
                            eventSource.close();
                            setConnectionStatus('disconnected');
                        }
                    } catch (_e) {
                        console.log('SSE 데이터 파싱 실패:', event.data);
                    }

                };

                eventSource.onerror = () => {
                    console.log('SSE 연결 종료 - 서버 미연결 또는 경매 종료');
                    setConnectionStatus('disconnected');
                    eventSource.close();

                    // 10초 후 재연결 시도 (서버 켜질 때까지)
                    setTimeout(() => {
                        if (auction?.status === 'IN_PROGRESS') {
                            connect();
                        }
                    }, 10000);
                };
            } catch (_e) {
                console.log('SSE 연결 시도 실패 - BE 서버 확인 필요');
                setConnectionStatus('disconnected');
            }

        };

        connect();

        // cleanup
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [auctionId, auction?.status]);


    const handleBid = async () => {
        if (!bidAmount || !auction) return;
        const amount = Number(bidAmount);
        if (amount <= auction.currentPrice) {
            alert('현재가보다 높은 금액을 입력해주세요');
            return;
        }

        setBidding(true);
        try {
            await api.createBid(auctionId, amount);
            setBidAmount('');
            alert('입찰 완료!');
            // SSE를 통해 업데이트가 오므로 여기서는 별도 처리 불필요
        } catch (_error) {

            // API 연동 전 Mock 처리
            setAuction(prev => prev ? { ...prev, currentPrice: amount, bidCount: (prev.bidCount || 0) + 1 } : null);
            setBidLogs(prev => [{ id: Date.now(), publicId: '나', bidAmount: amount, bidTime: new Date().toISOString() }, ...prev]);
            setBidAmount('');
            alert('입찰 완료! (Mock)');
        } finally {
            setBidding(false);
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
                                <img src={auction.imageUrl} alt="" className="w-full h-full object-cover" />
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
                                            className={`py-3 rounded-lg text-sm font-medium transition ${bidAmount === String(amount)
                                                ? 'bg-yellow-500 text-black'
                                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                                }`}
                                        >
                                            ₩{formatPrice(amount)}
                                            {i === 0 && <span className="block text-xs opacity-70">최소</span>}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleBid}
                                    disabled={bidding || !bidAmount}
                                    className="w-full lego-btn py-3 text-black font-bold disabled:opacity-50"
                                >
                                    {bidding ? '입찰 중...' : `₩${bidAmount ? formatPrice(Number(bidAmount)) : '금액 선택'} 입찰하기`}
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
                onVerified={() => {
                    // 인증 완료 후 memberInfo 업데이트 (실제로는 API에서 다시 조회)
                    setMemberInfo(prev => prev ? { ...prev, realName: '인증완료', contactPhone: '01012345678' } : null);
                }}
            />
        </div>
    );
}

