'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { client } from '@/api/client';
import { getErrorMessage } from '@/api/utils';
import type { components } from '@/api/schema';
import VerifyModal from '@/components/VerifyModal';

// 타입 정의 (스키마에서 가져옴)
type MyBid = components['schemas']['MyBidResponseDto'];
type MySale = components['schemas']['MySaleResponseDto'];
type WalletTransaction = components['schemas']['WalletTransactionResponseDto'];
type MemberInfo = components['schemas']['MemberMeResponseDto'];

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

type Tab = 'bids' | 'sales' | 'wallet';

export default function MyPage() {
    const [tab, setTab] = useState<Tab>('bids');
    const [myBids, setMyBids] = useState<MyBid[]>([]);
    const [mySales, setMySales] = useState<MySale[]>([]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    // 본인인증 여부 판단
    const isVerified = !!(memberInfo?.realNameMasked && memberInfo?.contactPhoneMasked);
    const userRole = memberInfo?.role as 'USER' | 'SELLER' | 'ADMIN' || 'USER';

    // 회원 정보 로드
    useEffect(() => {
        const loadMemberInfo = async () => {
            const { data, error } = await client.GET('/api/v1/members/me');
            if (data?.data) {
                setMemberInfo(data.data);
            } else if (error) {
                console.error('회원 정보 로드 실패:', getErrorMessage(error, '회원 정보를 불러올 수 없습니다.'));
            }
        };
        loadMemberInfo();
    }, []);

    // 탭 변경 시 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (tab === 'bids') {
                    const { data, error } = await client.GET('/api/v1/members/me/bids', {
                        params: { query: { pageable: { page: 0, size: 20 } } }
                    });
                    if (data?.data) {
                        setMyBids(data.data || []);
                    } else if (error) {
                        console.error('입찰 내역 로드 실패:', getErrorMessage(error, ''));
                    }
                } else if (tab === 'sales') {
                    const { data, error } = await client.GET('/api/v1/members/me/sales', {
                        params: { query: { pageable: { page: 0, size: 20 } } }
                    });
                    if (data?.data) {
                        setMySales(data.data || []);
                    } else if (error) {
                        console.error('판매 내역 로드 실패:', getErrorMessage(error, ''));
                    }
                } else if (tab === 'wallet') {
                    const { data, error } = await client.GET('/api/v1/payments/me/wallet-transactions', {
                        params: { query: { page: 0, size: 20 } }
                    });
                    if (data?.data?.data) {
                        setTransactions(data.data.data);
                    } else if (error) {
                        console.error('거래내역 로드 실패:', getErrorMessage(error, ''));
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tab]);

    // 상태 표시 헬퍼
    const getBidStatus = (bid: MyBid) => {
        const status = bid.auctionStatus;
        const isWinning = (bid.bidAmount ?? 0) >= (bid.currentPrice ?? 0);
        if (status === 'ENDED') {
            return isWinning ? { text: '낙찰', color: 'text-green-500' } : { text: '패찰', color: 'text-red-500' };
        }
        return isWinning ? { text: '1등', color: 'text-green-500' } : { text: '추월됨', color: 'text-red-500' };
    };

    const getSaleStatus = (sale: MySale) => {
        switch (sale.auctionStatus) {
            case 'IN_PROGRESS': return { text: '진행중', color: 'text-yellow-400' };
            case 'SCHEDULED': return { text: '예정', color: 'text-blue-400' };
            case 'ENDED':
                return sale.tradeStatus === 'SUCCESS'
                    ? { text: '낙찰', color: 'text-green-500' }
                    : { text: '유찰', color: 'text-red-500' };
            default: return { text: '대기중', color: 'text-gray-400' };
        }
    };

    const getTransactionSign = (tx: WalletTransaction) => {
        const balanceDelta = tx.balanceDelta ?? 0;
        const holdingDelta = tx.holdingDelta ?? 0;
        // 보증금 동결(holdingDelta > 0)은 사용 가능 금액 감소로 취급
        if (balanceDelta === 0 && holdingDelta !== 0) {
            return holdingDelta < 0; // 동결 해제는 positive, 동결은 negative
        }
        return balanceDelta >= 0;
    };

    const getTransactionAmount = (tx: WalletTransaction) => {
        const balanceDelta = tx.balanceDelta ?? 0;
        const holdingDelta = tx.holdingDelta ?? 0;
        // balanceDelta가 0이면 holdingDelta를 보여줌 (동결/해제)
        if (balanceDelta === 0 && holdingDelta !== 0) {
            return holdingDelta; // 동결이면 -로 표시
        }
        return balanceDelta;
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* 본인인증 안내 배너 */}
            {!isVerified && (
                <Link href="/verify" className="block mb-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 hover:bg-yellow-500/20 transition">
                        <p className="text-yellow-400 text-sm font-medium">
                            🔐 입찰 및 판매를 위해 본인인증이 필요합니다. <span className="underline">인증하기 →</span>
                        </p>
                    </div>
                </Link>
            )}

            {/* Profile */}
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[var(--lego-yellow)] rounded-full flex items-center justify-center">
                            <span className="text-2xl">🧱</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{memberInfo?.nickname || '로딩중...'}</p>
                                {isVerified && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">인증완료</span>}
                            </div>
                            <p className="text-sm text-gray-500">{memberInfo?.email || ''}</p>
                            {memberInfo?.intro && (
                                <p className="text-sm text-gray-400 mt-1 line-clamp-1">{memberInfo.intro}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">역할</p>
                        <p className="text-lg font-bold text-[var(--lego-yellow)]">{userRole}</p>
                        {memberInfo?.createdAt && (
                            <p className="text-[10px] text-gray-600 mt-1">가입일: {new Date(memberInfo.createdAt).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>

                {isVerified && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50 flex gap-6">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">이름</p>
                            <p className="text-sm font-medium text-gray-300">{memberInfo?.realNameMasked}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">연락처</p>
                            <p className="text-sm font-medium text-gray-300">{memberInfo?.contactPhoneMasked}</p>
                        </div>
                    </div>
                )}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                    <Link href="/settings" className="flex-1 btn-secondary py-2 text-center text-sm rounded-lg">
                        ⚙️ 설정
                    </Link>
                    {userRole === 'SELLER' ? (
                        <Link href="/products/register" className="flex-1 lego-btn py-2 text-center text-sm rounded-lg text-black font-medium">
                            🏪 판매자 센터
                        </Link>
                    ) : (
                        <button
                            onClick={() => {
                                if (!isVerified) {
                                    setShowVerifyModal(true);
                                } else {
                                    alert('판매자 등록 기능 준비 중입니다.');
                                }
                            }}
                            className="flex-1 lego-btn py-2 text-center text-sm rounded-lg text-black font-medium"
                        >
                            🛒 판매자 등록
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'bids' as Tab, label: '내 입찰' },
                    { key: 'sales' as Tab, label: '내 판매' },
                    { key: 'wallet' as Tab, label: '거래내역' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-3 rounded-lg font-medium transition ${tab === t.key ? 'btn-primary' : 'btn-secondary'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            ) : (
                <>
                    {/* 내 입찰 */}
                    {tab === 'bids' && (
                        <div className="space-y-3">
                            {myBids.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    입찰 내역이 없습니다
                                </div>
                            ) : (
                                myBids.map(bid => {
                                    const status = getBidStatus(bid);
                                    return (
                                        <Link key={bid.bidId} href={`/auctions/${bid.auctionId}`}>
                                            <div className="card p-4 hover:border-[var(--lego-yellow)]/50 transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium">경매 #{bid.auctionId}</p>
                                                        <p className="text-sm text-gray-500">내 입찰: ₩{formatPrice(bid.bidAmount ?? 0)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-medium ${status.color}`}>
                                                            {status.text}
                                                        </p>
                                                        <p className="text-sm text-gray-400">현재 ₩{formatPrice(bid.currentPrice ?? 0)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-700/50 text-xs">
                                                    <span className="text-gray-500">
                                                        상태: <span className="text-yellow-400">{bid.auctionStatus}</span>
                                                    </span>
                                                    <span className="text-gray-500">
                                                        마감: {formatDate(bid.endTime)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* 내 판매 */}
                    {tab === 'sales' && (
                        <div className="space-y-3">
                            {mySales.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    판매 내역이 없습니다
                                </div>
                            ) : (
                                mySales.map(sale => {
                                    const status = getSaleStatus(sale);
                                    return (
                                        <div key={sale.auctionId} className="card p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium">{sale.title || `경매 #${sale.auctionId}`}</p>
                                                    <p className="text-sm text-gray-500">입찰 {sale.bidCount ?? 0}건</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${status.color}`}>
                                                        {status.text}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {(sale.bidCount ?? 0) > 0 ? `현재 ₩${formatPrice(sale.currentPrice ?? 0)}` : '입찰 없음'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                                                <span className="text-xs text-gray-500">
                                                    마감: {formatDate(sale.endTime)}
                                                </span>
                                                {sale.actionRequired && (
                                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                                        조치 필요
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* 거래내역 */}
                    {tab === 'wallet' && (
                        <div className="space-y-3">
                            {/* 현재 잔고 요약 */}
                            {transactions.length > 0 && (() => {
                                const latestTx = transactions[0];
                                const totalBalance = latestTx?.balance ?? 0;
                                const holdingAmount = latestTx?.holdingAmount ?? 0;
                                const availableBalance = totalBalance - holdingAmount;
                                return (
                                    <div className="card p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">사용 가능</p>
                                                <p className="text-2xl font-bold text-yellow-400">
                                                    ₩{formatPrice(availableBalance)}
                                                </p>
                                            </div>
                                            {holdingAmount > 0 && (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">보증금</p>
                                                    <p className="text-sm text-gray-400">₩{formatPrice(holdingAmount)}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-2 border-t border-gray-700/50 text-xs text-gray-500">
                                            총 잔고: ₩{formatPrice(totalBalance)}
                                        </div>
                                    </div>
                                );
                            })()}

                            {transactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    거래 내역이 없습니다
                                </div>
                            ) : (
                                transactions.map((tx) => {
                                    const isPositive = getTransactionSign(tx);
                                    return (
                                        <div key={tx.id} className="card p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{tx.typeName || tx.type}</p>
                                                <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isPositive ? '+' : '-'}₩{formatPrice(getTransactionAmount(tx))}
                                                </p>
                                                <p className="text-xs text-gray-500">잔액: ₩{formatPrice(tx.balance ?? 0)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <Link href="/payment" className="block">
                                <div className="card p-4 text-center hover:border-[var(--lego-yellow)]/50 transition">
                                    <p className="text-yellow-400 font-medium">💰 예치금 충전하기</p>
                                </div>
                            </Link>
                        </div>
                    )}
                </>
            )}

            {/* 본인인증 모달 */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={async () => {
                    // 회원 정보 새로고침
                    const { data } = await client.GET('/api/v1/members/me');
                    if (data?.data) {
                        setMemberInfo(data.data);
                    }
                    setShowVerifyModal(false);
                    alert('본인인증이 완료되었습니다.');
                }}
            />
        </div>
    );
}
