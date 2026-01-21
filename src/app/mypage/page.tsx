'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, MyBid, MySale } from '@/lib/api';
import VerifyModal from '@/components/VerifyModal';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

type Tab = 'bids' | 'sales' | 'wallet';

// Mock 거래내역 (API 연동 전까지 사용)
const mockTx = [
    { type: '충전', amount: 100000, date: '01/20 10:30', positive: true },
    { type: '입찰 보증금', amount: -50000, date: '01/19 15:20', positive: false },
    { type: '환불', amount: 50000, date: '01/18 09:45', positive: true },
];

export default function MyPage() {
    const [tab, setTab] = useState<Tab>('bids');
    const [myBids, setMyBids] = useState<MyBid[]>([]);
    const [mySales, setMySales] = useState<MySale[]>([]);
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false); // 본인인증 여부
    const [userRole, setUserRole] = useState<'USER' | 'SELLER' | 'ADMIN'>('USER'); // 역할
    const [showVerifyModal, setShowVerifyModal] = useState(false);

    // 탭 변경 시 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (tab === 'bids') {
                    const result = await api.getMyBids();
                    setMyBids(result.content || []);
                } else if (tab === 'sales') {
                    const result = await api.getMySales();
                    setMySales(result.content || []);
                }
            } catch (error) {
                console.error('데이터 로드 실패:', error);
                // API 연동 전 Mock 데이터 사용
                if (tab === 'bids') {
                    setMyBids([
                        { auctionId: 1, productName: '레고 스타워즈 밀레니엄 팔콘', productImageUrl: '/placeholder.jpg', startPrice: 800000, currentPrice: 1250000, myBidAmount: 1250000, status: 'IN_PROGRESS', auctionEndTime: '2026-01-22T22:00:00', isWinning: true },
                        { auctionId: 2, productName: '레고 테크닉 포르쉐 911', productImageUrl: '/placeholder.jpg', startPrice: 350000, currentPrice: 520000, myBidAmount: 480000, status: 'IN_PROGRESS', auctionEndTime: '2026-01-21T20:00:00', isWinning: false },
                    ]);
                } else if (tab === 'sales') {
                    setMySales([
                        { auctionId: 3, productId: 3, productName: '레고 해리포터 호그와트 성', startPrice: 500000, currentPrice: 780000, bidCount: 31, status: 'IN_PROGRESS', auctionEndTime: '2026-01-20T21:00:00' },
                        { auctionId: 4, productId: 4, productName: '레고 닌자고 시티 가든 (유찰)', startPrice: 300000, currentPrice: 300000, bidCount: 0, status: 'FAILED', auctionEndTime: '2026-01-18T22:00:00' },
                    ]);
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tab]);

    // 상태 표시 헬퍼
    const getBidStatus = (bid: MyBid) => {
        if (bid.status === 'ENDED') {
            return bid.isWinning ? { text: '낙찰', color: 'text-green-500' } : { text: '패찰', color: 'text-red-500' };
        }
        return bid.isWinning ? { text: '낙찰 예정', color: 'text-green-500' } : { text: '패찰', color: 'text-red-500' };
    };

    const getSaleStatus = (sale: MySale) => {
        switch (sale.status) {
            case 'IN_PROGRESS': return { text: '진행중', color: 'text-yellow-400' };
            case 'SCHEDULED': return { text: '예정', color: 'text-blue-400' };
            case 'ENDED': return { text: '낙찰', color: 'text-green-500' };
            case 'FAILED': return { text: '유찰', color: 'text-red-500' };
            default: return { text: '대기중', color: 'text-gray-400' };
        }
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
                                <p className="font-semibold">레고덕후</p>
                                {isVerified && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">인증완료</span>}
                            </div>
                            <p className="text-sm text-gray-500">lego@email.com</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">잔액</p>
                        <p className="text-xl font-bold text-[var(--lego-yellow)]">₩{formatPrice(500000)}</p>
                    </div>
                </div>
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
                                    // 판매자 등록 API 호출 (BE에서 역할 변경)
                                    alert('판매자 등록이 완료되었습니다!');
                                    setUserRole('SELLER');
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
                                    const deposit = api.calculateDeposit(bid.startPrice);
                                    return (
                                        <Link key={bid.auctionId} href={`/auctions/${bid.auctionId}`}>
                                            <div className="card p-4 hover:border-[var(--lego-yellow)]/50 transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{bid.productName}</p>
                                                        <p className="text-sm text-gray-500">내 입찰: ₩{formatPrice(bid.myBidAmount)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-medium ${status.color}`}>
                                                            {status.text}
                                                        </p>
                                                        <p className="text-sm text-gray-400">현재 ₩{formatPrice(bid.currentPrice)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-700/50 text-xs">
                                                    <span className="text-gray-500">
                                                        💰 보증금: <span className="text-yellow-400">₩{formatPrice(deposit)}</span>
                                                    </span>
                                                    <span className="text-gray-500">
                                                        시작가: ₩{formatPrice(bid.startPrice)}
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
                                                    <p className="font-medium">{sale.productName}</p>
                                                    <p className="text-sm text-gray-500">시작가: ₩{formatPrice(sale.startPrice)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${status.color}`}>
                                                        {status.text}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {sale.bidCount > 0 ? `현재 ₩${formatPrice(sale.currentPrice)}` : '입찰 없음'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                                                <span className="text-xs text-gray-500">
                                                    입찰 {sale.bidCount}건
                                                </span>
                                                {sale.status === 'FAILED' && (
                                                    <button
                                                        className="text-xs bg-yellow-500 text-black px-3 py-1 rounded-full font-medium hover:bg-yellow-400 transition"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // TODO: 재등록 페이지로 이동
                                                            alert('재등록 기능 준비 중');
                                                        }}
                                                    >
                                                        🔄 재등록
                                                    </button>
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
                        <div className="space-y-2">
                            {mockTx.map((tx, i) => (
                                <div key={i} className="card p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{tx.type}</p>
                                        <p className="text-xs text-gray-500">{tx.date}</p>
                                    </div>
                                    <p className={`font-semibold ${tx.positive ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.positive ? '+' : ''}₩{formatPrice(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 본인인증 모달 */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                onVerified={() => {
                    setIsVerified(true);
                    // 인증 완료 후 판매자 등록 진행
                    alert('본인인증이 완료되었습니다. 이제 판매자로 등록할 수 있습니다.');
                }}
            />
        </div>
    );
}

