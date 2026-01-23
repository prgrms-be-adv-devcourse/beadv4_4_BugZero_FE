'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, getImageUrl } from '@/lib/api';
import { components } from '@/api/schema';
import LikeButton from '@/components/LikeButton';
import { useWishlistStore } from '@/store/useWishlistStore';

type WishlistItem = components["schemas"]["WishlistListResponseDto"];

function formatPrice(price?: number): string {
    return new Intl.NumberFormat('ko-KR').format(price ?? 0);
}

function getTimeRemaining(endDate?: string): string {
    if (!endDate) return '종료됨';
    const total = new Date(endDate).getTime() - Date.now();
    if (total <= 0) return '종료됨';
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}일 ${hours}시간`;
    return `${hours}시간`;
}

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const likedAuctionIds = useWishlistStore(state => state.likedAuctionIds);

    // 찜 목록 변경 시 리스트 다시 불러오기 (혹은 로컬 필터링)
    useEffect(() => {
        // 이미 스토어에 상태가 있지만, 상세 정보(이미지 등)를 보여주기 위해 API 호출 필요
        // 단, 여기서는 간단하게 API를 새로 불러오거나, 스토어의 ID 기반으로 필터링 할 수 있음.
        // API 명세상 getMyBookmarks가 리스트를 반환하므로 그것을 사용.
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
    }, [likedAuctionIds]); // 찜 해제 시 목록 갱신을 위해 의존성 추가

    // API 응답 구조에 맞게 매핑
    const activeItems = wishlist.filter(item => item.auctionInfo?.auctionStatus === 'IN_PROGRESS' || item.auctionInfo?.auctionStatus === 'SCHEDULED');
    const endedItems = wishlist.filter(item => item.auctionInfo?.auctionStatus === 'ENDED' || item.auctionInfo?.auctionStatus === 'WITHDRAWN');

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-4">불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
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

            {/* 진행 중인 경매 */}
            {activeItems.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full pulse-live"></span>
                        진행 중 ({activeItems.length})
                    </h2>

                    <div className="space-y-4">
                        {activeItems.map((item) => {
                            const info = item.auctionInfo!;
                            return (
                                <Link key={item.bookmarkId} href={`/auctions/${info.auctionId}`}>
                                    <div className="lego-card p-4 flex gap-4 group cursor-pointer border border-[#1a1a1a] hover:border-yellow-500/50 transition bg-[#0d0d0d]">
                                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative">
                                            {info.thumbnailUrl ? (
                                                <Image
                                                    src={getImageUrl(info.thumbnailUrl)}
                                                    alt={info.productName || ''}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">🧱</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="font-bold text-white truncate group-hover:text-yellow-400 transition text-lg">
                                                {info.productName}
                                            </h3>
                                            <p className="text-xl font-bold text-yellow-400 mt-1">
                                                ₩{formatPrice(info.currentPrice)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                                                <span>🔥 {info.bidsCount || 0}회 입찰</span>
                                                <span className="text-red-400 font-medium">⏰ {getTimeRemaining(info.endTime)}</span>
                                            </div>
                                        </div>

                                        <div onClick={(e) => e.preventDefault()}>
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
                    <h2 className="text-lg font-bold text-gray-400 mb-4">
                        종료됨 ({endedItems.length})
                    </h2>

                    <div className="space-y-4">
                        {endedItems.map((item) => {
                            const info = item.auctionInfo!;
                            return (
                                <div key={item.bookmarkId} className="bg-[#0d0d0d] rounded-xl p-4 flex gap-4 border border-[#1a1a1a] opacity-60">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative grayscale">
                                        {info.thumbnailUrl ? (
                                            <Image src={getImageUrl(info.thumbnailUrl)} alt="" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">🧱</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h3 className="font-bold text-gray-400 truncate">
                                            {info.productName}
                                        </h3>
                                        <p className="text-lg font-bold text-gray-500 mt-1">
                                            ₩{formatPrice(info.currentPrice)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            경매 종료됨
                                        </p>
                                    </div>

                                    <div onClick={(e) => e.preventDefault()}>
                                        <LikeButton auctionId={info.auctionId!} className="p-2 text-gray-600 hover:text-red-400" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {wishlist.length === 0 && (
                <div className="text-center py-20 bg-[#0d0d0d] rounded-2xl border border-[#1a1a1a]">
                    <p className="text-6xl mb-6">💛</p>
                    <p className="text-gray-400 mb-6 text-lg">아직 관심 등록한 경매가 없습니다.</p>
                    <Link href="/" className="inline-block px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition">
                        경매 둘러보기
                    </Link>
                </div>
            )}
        </div>
    );
}
