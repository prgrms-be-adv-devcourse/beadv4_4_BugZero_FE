'use client';

import { useState } from 'react';
import Link from 'next/link';

type AuctionResultTab = 'won' | 'lost' | 'failed';

interface AuctionResult {
    id: number;
    productName: string;
    imageUrl: string;
    finalPrice: number;
    myBidAmount: number;
    endedAt: string;
    status: 'WON' | 'LOST' | 'FAILED';
    paymentStatus?: 'PENDING' | 'PAID' | 'EXPIRED';
    paymentDeadline?: string;
}

const mockResults: AuctionResult[] = [
    {
        id: 1,
        productName: '레고 스타워즈 밀레니엄 팔콘 75192',
        imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400',
        finalPrice: 1250000,
        myBidAmount: 1250000,
        endedAt: '2026-01-20T22:00:00',
        status: 'WON',
        paymentStatus: 'PENDING',
        paymentDeadline: '2026-01-21T22:00:00',
    },
    {
        id: 2,
        productName: '레고 테크닉 포르쉐 911 GT3 RS',
        imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
        finalPrice: 520000,
        myBidAmount: 480000,
        endedAt: '2026-01-19T20:00:00',
        status: 'LOST',
    },
    {
        id: 3,
        productName: '레고 해리포터 호그와트 성',
        imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400',
        finalPrice: 780000,
        myBidAmount: 780000,
        endedAt: '2026-01-18T21:00:00',
        status: 'WON',
        paymentStatus: 'PAID',
    },
];

const mockFailedAuctions = [
    {
        id: 4,
        productName: '레고 닌자고 시티 가든',
        imageUrl: 'https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400',
        startPrice: 300000,
        endedAt: '2026-01-17T22:00:00',
        reason: 'NO_BIDS',
    },
];

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTimeRemaining(deadline: string): { text: string; urgent: boolean } {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) return { text: '만료됨', urgent: true };

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    if (hours < 24) return { text: `${hours}시간 남음`, urgent: true };
    return { text: `${Math.floor(hours / 24)}일 남음`, urgent: false };
}

export default function AuctionResultsPage() {
    const [activeTab, setActiveTab] = useState<AuctionResultTab>('won');

    const wonAuctions = mockResults.filter(r => r.status === 'WON');
    const lostAuctions = mockResults.filter(r => r.status === 'LOST');

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/mypage" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 마이페이지
            </Link>

            <h1 className="text-3xl font-bold text-white mb-2">경매 결과</h1>
            <p className="text-gray-400 mb-8">참여했던 경매의 최종 결과를 확인하세요</p>

            {/* 탭 */}
            <div className="flex gap-2 mb-8">
                {[
                    { key: 'won' as const, label: '낙찰', icon: '🏆', count: wonAuctions.length },
                    { key: 'lost' as const, label: '패찰', icon: '😢', count: lostAuctions.length },
                    { key: 'failed' as const, label: '유찰 (판매자)', icon: '💔', count: mockFailedAuctions.length },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${activeTab === tab.key
                                ? 'bg-gradient-to-r from-yellow-500 to-red-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-700'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* 낙찰 목록 */}
            {activeTab === 'won' && (
                <div className="space-y-4">
                    {wonAuctions.map((auction) => {
                        const deadline = auction.paymentDeadline ? getTimeRemaining(auction.paymentDeadline) : null;

                        return (
                            <div key={auction.id} className="lego-card p-5">
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                                        <img src={auction.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-white">{auction.productName}</h3>
                                            {auction.paymentStatus === 'PENDING' && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${deadline?.urgent ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 text-black'
                                                    }`}>
                                                    결제 대기
                                                </span>
                                            )}
                                            {auction.paymentStatus === 'PAID' && (
                                                <span className="bg-green-500 px-3 py-1 rounded-full text-xs font-bold">
                                                    결제 완료
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-2xl font-bold text-yellow-400 mb-3">
                                            ₩{formatPrice(auction.finalPrice)}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500">
                                                종료: {formatDate(auction.endedAt)}
                                            </p>

                                            {auction.paymentStatus === 'PENDING' && deadline && (
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm ${deadline.urgent ? 'text-red-400' : 'text-gray-400'}`}>
                                                        ⏰ {deadline.text}
                                                    </span>
                                                    <Link
                                                        href={`/payment/auction/${auction.id}`}
                                                        className="lego-btn text-sm py-2 px-4 text-black"
                                                    >
                                                        결제하기
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {wonAuctions.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">🏆</p>
                            <p className="text-gray-400">아직 낙찰 내역이 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* 패찰 목록 */}
            {activeTab === 'lost' && (
                <div className="space-y-4">
                    {lostAuctions.map((auction) => (
                        <div key={auction.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 opacity-75">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 grayscale">
                                    <img src={auction.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-400 mb-2">{auction.productName}</h3>

                                    <div className="flex gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500">최종 낙찰가</p>
                                            <p className="text-lg font-bold text-gray-400">
                                                ₩{formatPrice(auction.finalPrice)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">내 입찰가</p>
                                            <p className="text-lg font-bold text-red-400">
                                                ₩{formatPrice(auction.myBidAmount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">차액</p>
                                            <p className="text-lg font-bold text-red-400">
                                                -₩{formatPrice(auction.finalPrice - auction.myBidAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500">
                                        종료: {formatDate(auction.endedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {lostAuctions.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">🎯</p>
                            <p className="text-gray-400">패찰 내역이 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* 유찰 목록 (판매자용) */}
            {activeTab === 'failed' && (
                <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                        <p className="text-yellow-400 text-sm">
                            💡 유찰된 상품은 재등록하여 다시 경매를 진행할 수 있습니다.
                        </p>
                    </div>

                    {mockFailedAuctions.map((auction) => (
                        <div key={auction.id} className="bg-gray-800 rounded-xl p-5 border border-red-500/30">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                                    <img src={auction.imageUrl} alt="" className="w-full h-full object-cover opacity-50" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white">{auction.productName}</h3>
                                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                                            유찰
                                        </span>
                                    </div>

                                    <p className="text-gray-400 mb-3">
                                        시작가: ₩{formatPrice(auction.startPrice)}
                                    </p>

                                    <p className="text-sm text-red-400 mb-3">
                                        {auction.reason === 'NO_BIDS' && '❌ 입찰자 없음'}
                                        {auction.reason === 'PAYMENT_EXPIRED' && '❌ 낙찰자 결제 기한 만료'}
                                    </p>

                                    <div className="flex gap-3">
                                        <button className="lego-btn text-sm py-2 px-4 text-black">
                                            🔄 재등록하기
                                        </button>
                                        <button className="bg-gray-700 text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition">
                                            삭제하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {mockFailedAuctions.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">✅</p>
                            <p className="text-gray-400">유찰된 경매가 없습니다</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
