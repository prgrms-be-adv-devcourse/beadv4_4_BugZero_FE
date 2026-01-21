'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';


interface WishlistItem {
    id: number;
    productName: string;
    imageUrl: string;
    currentPrice: number;
    bidCount: number;
    status: 'ACTIVE' | 'ENDED';
    endedAt: string;
}

const mockWishlist: WishlistItem[] = [
    {
        id: 1,
        productName: '레고 스타워즈 밀레니엄 팔콘 75192',
        imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400',
        currentPrice: 1250000,
        bidCount: 23,
        status: 'ACTIVE',
        endedAt: '2026-01-22T22:00:00'
    },
    {
        id: 2,
        productName: '레고 테크닉 포르쉐 911 GT3 RS',
        imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
        currentPrice: 520000,
        bidCount: 15,
        status: 'ACTIVE',
        endedAt: '2026-01-21T20:00:00'
    },
    {
        id: 5,
        productName: '레고 크리에이터 런던 버스',
        imageUrl: 'https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400',
        currentPrice: 150000,
        bidCount: 5,
        status: 'ENDED',
        endedAt: '2026-01-15T22:00:00'
    },
];

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function getTimeRemaining(endDate: string): string {
    const total = new Date(endDate).getTime() - Date.now();
    if (total <= 0) return '종료됨';

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    return `${hours}시간`;
}

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState(mockWishlist);

    const handleRemove = (id: number) => {
        setWishlist(prev => prev.filter(item => item.id !== id));
    };

    const activeItems = wishlist.filter(item => item.status === 'ACTIVE');
    const endedItems = wishlist.filter(item => item.status === 'ENDED');

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/mypage" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 마이페이지
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">관심 경매</h1>
                    <p className="text-gray-400 mt-1">{wishlist.length}개의 경매를 관심 등록 중</p>
                </div>
                <span className="text-4xl">💛</span>
            </div>

            {/* 진행 중인 경매 */}
            {activeItems.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full pulse-live"></span>
                        진행 중 ({activeItems.length})
                    </h2>

                    <div className="space-y-4">
                        {activeItems.map((item) => (
                            <Link key={item.id} href={`/auctions/${item.id}`}>
                                <div className="lego-card p-4 flex gap-4 group cursor-pointer">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate group-hover:text-yellow-400 transition">
                                            {item.productName}
                                        </h3>
                                        <p className="text-xl font-bold text-yellow-400 mt-1">
                                            ₩{formatPrice(item.currentPrice)}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                            <span>🔥 {item.bidCount}회 입찰</span>
                                            <span className="text-red-400">⏰ {getTimeRemaining(item.endedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-between items-end">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemove(item.id);
                                            }}
                                            className="text-gray-500 hover:text-red-400 transition text-xl"
                                        >
                                            💔
                                        </button>
                                        <span className="lego-btn text-sm py-1 px-3 text-black">
                                            입찰하기
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 종료된 경매 */}
            {endedItems.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-400 mb-4">
                        종료됨 ({endedItems.length})
                    </h2>

                    <div className="space-y-4">
                        {endedItems.map((item) => (
                            <div key={item.id} className="bg-gray-800 rounded-xl p-4 flex gap-4 border border-gray-700 opacity-60">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 grayscale">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-400 truncate">
                                        {item.productName}
                                    </h3>
                                    <p className="text-xl font-bold text-gray-500 mt-1">
                                        ₩{formatPrice(item.currentPrice)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        경매 종료됨
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="text-gray-600 hover:text-red-400 transition text-xl self-start"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {wishlist.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-6xl mb-4">💛</p>
                    <p className="text-gray-400 mb-4">아직 관심 등록한 경매가 없습니다</p>
                    <Link href="/" className="text-yellow-400 hover:underline">
                        경매 둘러보기 →
                    </Link>
                </div>
            )}
        </div>
    );
}
