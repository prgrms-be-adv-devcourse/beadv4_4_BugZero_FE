'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { components } from '@/api/schema';
import LikeButton from '@/components/LikeButton';
import { useWishlistStore } from '@/store/useWishlistStore';

type WishlistItem = components["schemas"]["WishlistListResponseDto"];

function formatPrice(price?: number): string {
    return new Intl.NumberFormat('ko-KR').format(price ?? 0);
}

function getTimeRemaining(date?: string): string {
    if (!date) return '-';
    const total = new Date(date).getTime() - Date.now();
    if (total <= 0) return '0분';

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
}

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { fetchMyBookmarks } = useWishlistStore();

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await api.getMyBookmarks({ page: 0, size: 100 });
                if (res && res.data) {
                    setWishlist(res.data);
                }
            } catch (e) {
                console.error("Failed to load wishlist", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // 1. 진행 중 & 예정된 경매 필터링 및 정렬
    const activeItems = wishlist
        .filter(item => item.auctionInfo?.auctionStatus === 'IN_PROGRESS' || item.auctionInfo?.auctionStatus === 'SCHEDULED')
        .sort((a, b) => {
            const infoA = a.auctionInfo!;
            const infoB = b.auctionInfo!;

            // 진행 중인 것을 우선순위로
            if (infoA.auctionStatus === 'IN_PROGRESS' && infoB.auctionStatus === 'SCHEDULED') return -1;
            if (infoA.auctionStatus === 'SCHEDULED' && infoB.auctionStatus === 'IN_PROGRESS') return 1;

            // 동일 상태 내에서의 정렬
            if (infoA.auctionStatus === 'IN_PROGRESS') {
                // 종료 임박순
                return new Date(infoA.endTime!).getTime() - new Date(infoB.endTime!).getTime();
            } else {
                // 시작 정보가 없으므로 종료 시간 기준 (또는 ID 기준)
                return new Date(infoA.endTime!).getTime() - new Date(infoB.endTime!).getTime();
            }
        });

    // 2. 종료된 경매 필터링 및 정렬 (최근 종료순)
    const endedItems = wishlist
        .filter(item => item.auctionInfo?.auctionStatus === 'ENDED' || item.auctionInfo?.auctionStatus === 'WITHDRAWN')
        .sort((a, b) => {
            const infoA = a.auctionInfo!;
            const infoB = b.auctionInfo!;
            return new Date(infoB.endTime!).getTime() - new Date(infoA.endTime!).getTime();
        });

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                ← 홈으로
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">관심 경매</h1>
                    <p className="text-gray-400 mt-1">{wishlist.length}개의 경매를 관심 등록 중</p>
                </div>
                <span className="text-4xl">💛</span>
            </div>

            {/* 활성 경매 (진행 중 + 예정) */}
            {activeItems.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-lg font-bold text-yellow-400 mb-6 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full pulse-live"></span>
                        활성 경매 ({activeItems.length})
                    </h2>

                    <div className="grid gap-4">
                        {activeItems.map((item) => {
                            const info = item.auctionInfo!;
                            const isScheduled = info.auctionStatus === 'SCHEDULED';

                            return (
                                <Link key={item.bookmarkId} href={`/auctions/${info.auctionId}`}>
                                    <div className="lego-card p-4 flex gap-5 group cursor-pointer border border-white/5 hover:border-yellow-500/50 transition-all bg-[#0d0d0d] relative overflow-hidden">
                                        {/* Status Badge */}
                                        <div className="absolute top-4 right-4 z-10">
                                            {isScheduled ? (
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">
                                                    시작 전
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                    진행 중
                                                </span>
                                            )}
                                        </div>

                                        <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 relative">
                                            {info.thumbnailUrl ? (
                                                <Image
                                                    src={info.thumbnailUrl}
                                                    alt={info.productName || ''}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">🧱</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center pr-16">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {info.category}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-white truncate group-hover:text-yellow-400 transition text-xl mb-1">
                                                {info.productName}
                                            </h3>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-2xl font-black text-yellow-400">
                                                    ₩{formatPrice(info.currentPrice)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    시작가 ₩{formatPrice(info.startPrice)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <span>🔥 입찰</span>
                                                    <span className="text-white font-medium">{info.bidsCount || 0}회</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">{isScheduled ? '⏰ 상태' : '⏰ 남은시간'}</span>
                                                    <span className={`${isScheduled ? 'text-blue-400' : 'text-red-400'} font-bold`}>
                                                        {isScheduled ? '시작 예정' : getTimeRemaining(info.endTime)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex items-center pr-2">
                                            <LikeButton auctionId={info.auctionId!} className="p-3 hover:bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 종료된 경매 */}
            {endedItems.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-500 mb-6 flex items-center gap-2">
                        종료된 경매 ({endedItems.length})
                    </h2>

                    <div className="grid gap-3">
                        {endedItems.map((item) => {
                            const info = item.auctionInfo!;
                            const isWithdrawn = info.auctionStatus === 'WITHDRAWN';

                            return (
                                <div key={item.bookmarkId} className="bg-[#080808] rounded-2xl p-4 flex gap-5 border border-white/5 opacity-50 hover:opacity-80 transition-opacity relative group">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 relative grayscale">
                                        {info.thumbnailUrl ? (
                                            <>
                                                <Image src={info.thumbnailUrl} alt="" fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white border border-white/30 px-1.5 py-0.5 rounded">
                                                        {isWithdrawn ? '철회됨' : '종료됨'}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl grayscale">🧱</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h3 className="font-bold text-gray-400 truncate text-lg">
                                            {info.productName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-lg font-bold text-gray-600">
                                                낙찰가 ₩{formatPrice(info.currentPrice)}
                                            </span>
                                            <span className="text-xs text-gray-700">|</span>
                                            <span className="text-xs text-gray-600">
                                                {isWithdrawn ? '경매 철회됨' : '경매 종료됨'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-700 mt-1">
                                            종료 일시: {info.endTime?.replace('T', ' ').substring(0, 16)}
                                        </p>
                                    </div>

                                    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex items-center pr-2">
                                        <LikeButton auctionId={info.auctionId!} className="p-2 text-gray-600 hover:text-red-400 grayscale transition-all" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {wishlist.length === 0 && (
                <div className="text-center py-32 bg-[#0d0d0d] rounded-[2rem] border border-white/5">
                    <p className="text-7xl mb-8">💛</p>
                    <p className="text-gray-400 mb-8 text-xl font-medium">아직 관심 등록한 경매가 없습니다.</p>
                    <Link href="/" className="inline-block px-10 py-4 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-400/20">
                        경매 둘러보기
                    </Link>
                </div>
            )}
        </div>
    );
}
