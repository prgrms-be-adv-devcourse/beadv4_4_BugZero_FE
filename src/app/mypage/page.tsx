'use client';

import { useState } from 'react';
import Link from 'next/link';

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

// 탭 타입
type TabType = 'bids' | 'sales' | 'wallet';

// Mock 데이터
const mockBids = [
    {
        id: 1,
        productName: '레고 스타워즈 밀레니엄 팔콘',
        myBidAmount: 1250000,
        currentPrice: 1250000,
        status: 'WINNING',
        endedAt: '2026-01-22T22:00:00'
    },
    {
        id: 2,
        productName: '레고 테크닉 포르쉐 911',
        myBidAmount: 480000,
        currentPrice: 520000,
        status: 'OUTBID',
        endedAt: '2026-01-21T20:00:00'
    },
    {
        id: 3,
        productName: '레고 해리포터 호그와트',
        myBidAmount: 780000,
        currentPrice: 780000,
        status: 'WON',
        endedAt: '2026-01-18T21:00:00'
    },
];

const mockSales = [
    {
        id: 4,
        productName: '레고 크리에이터 런던 버스',
        currentPrice: 150000,
        bidCount: 5,
        status: 'ACTIVE',
        endedAt: '2026-01-23T20:00:00'
    },
    {
        id: 5,
        productName: '레고 마인크래프트 마을',
        currentPrice: 89000,
        bidCount: 3,
        status: 'ENDED',
        endedAt: '2026-01-15T18:00:00'
    },
];

export default function MyPage() {
    const [activeTab, setActiveTab] = useState<TabType>('bids');
    const [walletBalance] = useState(500000);

    const statusText = {
        WINNING: '낙찰 예정',
        OUTBID: '패찰',
        WON: '낙찰됨',
        ACTIVE: '진행 중',
        ENDED: '종료'
    };

    const statusColors = {
        WINNING: 'bg-green-500',
        OUTBID: 'bg-gray-500',
        WON: 'bg-yellow-500',
        ACTIVE: 'bg-green-500',
        ENDED: 'bg-gray-500'
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* 프로필 헤더 */}
            <div className="lego-card p-8 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-4xl">
                        🧱
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white mb-1">레고덕후</h1>
                        <p className="text-gray-400">lego_lover@email.com</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">지갑 잔액</p>
                        <p className="text-2xl font-bold text-yellow-400">
                            ₩{formatPrice(walletBalance)}
                        </p>
                        <Link href="/payment" className="text-sm text-yellow-400 hover:underline">
                            충전하기 →
                        </Link>
                    </div>
                </div>
            </div>

            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'bids', label: '내 입찰', icon: '🎯' },
                    { key: 'sales', label: '내 판매', icon: '💼' },
                    { key: 'wallet', label: '거래 내역', icon: '💰' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as TabType)}
                        className={`flex-1 py-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-yellow-500 to-red-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 내 입찰 탭 */}
            {activeTab === 'bids' && (
                <div className="space-y-4">
                    {mockBids.map((bid) => (
                        <Link key={bid.id} href={`/auctions/${bid.id}`}>
                            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-yellow-500 transition cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-white mb-1">{bid.productName}</h3>
                                        <p className="text-sm text-gray-400">
                                            종료: {formatDate(bid.endedAt)}
                                        </p>
                                    </div>
                                    <span className={`${statusColors[bid.status]} px-3 py-1 rounded-full text-xs font-bold`}>
                                        {statusText[bid.status]}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-gray-500">내 입찰가</p>
                                        <p className="text-lg font-bold text-yellow-400">
                                            ₩{formatPrice(bid.myBidAmount)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">현재가</p>
                                        <p className={`text-lg font-bold ${bid.myBidAmount >= bid.currentPrice ? 'text-green-400' : 'text-red-400'}`}>
                                            ₩{formatPrice(bid.currentPrice)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {mockBids.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">🎯</p>
                            <p className="text-gray-400">아직 입찰 내역이 없습니다</p>
                            <Link href="/" className="text-yellow-400 hover:underline mt-2 inline-block">
                                경매 둘러보기 →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* 내 판매 탭 */}
            {activeTab === 'sales' && (
                <div className="space-y-4">
                    {mockSales.map((sale) => (
                        <div key={sale.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-white mb-1">{sale.productName}</h3>
                                    <p className="text-sm text-gray-400">
                                        입찰 {sale.bidCount}회 · 종료: {formatDate(sale.endedAt)}
                                    </p>
                                </div>
                                <span className={`${statusColors[sale.status]} px-3 py-1 rounded-full text-xs font-bold`}>
                                    {statusText[sale.status]}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-500">현재가</p>
                                    <p className="text-lg font-bold text-yellow-400">
                                        ₩{formatPrice(sale.currentPrice)}
                                    </p>
                                </div>
                                {sale.status === 'ACTIVE' && (
                                    <button className="text-sm text-red-400 hover:underline">
                                        경매 취소
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {mockSales.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">💼</p>
                            <p className="text-gray-400">아직 판매 내역이 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* 거래 내역 탭 */}
            {activeTab === 'wallet' && (
                <div className="space-y-3">
                    {[
                        { type: '지갑 충전', amount: 100000, date: '2026-01-20 10:30', positive: true },
                        { type: '입찰 보증금', amount: -50000, date: '2026-01-19 15:20', positive: false },
                        { type: '보증금 환불', amount: 50000, date: '2026-01-18 09:45', positive: true },
                        { type: '낙찰 결제', amount: -350000, date: '2026-01-17 22:10', positive: false },
                        { type: '정산 완료', amount: 285000, date: '2026-01-16 06:00', positive: true },
                    ].map((tx, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center p-4 bg-gray-800 rounded-xl border border-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                    {tx.positive ? '💚' : '💸'}
                                </span>
                                <div>
                                    <p className="font-medium text-white">{tx.type}</p>
                                    <p className="text-xs text-gray-500">{tx.date}</p>
                                </div>
                            </div>
                            <p className={`text-lg font-bold ${tx.positive ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.positive ? '+' : ''}₩{formatPrice(tx.amount)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
