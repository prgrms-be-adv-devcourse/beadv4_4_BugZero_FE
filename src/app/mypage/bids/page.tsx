'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type MyBid } from '@/lib/api';
import { parseDate } from '@/lib/utils';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = parseDate(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MyBidsPage() {
    const [myBids, setMyBids] = useState<MyBid[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    const loadBids = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const data = await api.getMyBids(undefined, { page: pageNum, size: pageSize });
            if (data?.data) {
                setMyBids(data.data);
                setHasMore(data.data.length === pageSize);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBids(page);
    }, [page, loadBids]);

    const getBidStatus = (bid: MyBid) => {
        const status = bid.auctionStatus;
        const isWinning = (bid.bidAmount ?? 0) >= (bid.currentPrice ?? 0);
        if (status === 'ENDED') {
            return isWinning ? { text: '낙찰', color: 'text-green-500' } : { text: '패찰', color: 'text-red-500' };
        }
        return isWinning ? { text: '1등', color: 'text-green-500' } : { text: '추월됨', color: 'text-red-500' };
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-card rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">내 입찰 내역</h1>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted">로딩 중...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {myBids.length === 0 ? (
                        <div className="text-center py-12 text-muted">
                            입찰 내역이 없습니다
                        </div>
                    ) : (
                        myBids.map(bid => {
                            const status = getBidStatus(bid);
                            return (
                                <Link key={bid.bidId} href={`/auctions/${bid.auctionId}`}>
                                    <div className="card p-4 hover:border-[var(--lego-yellow)]/50 transition bg-card border border-border rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium">경매 #{bid.auctionId}</p>
                                                <p className="text-sm text-muted">내 입찰: ₩{formatPrice(bid.bidAmount ?? 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${status.color}`}>
                                                    {status.text}
                                                </p>
                                                <p className="text-sm text-muted">현재 ₩{formatPrice(bid.currentPrice ?? 0)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs">
                                            <span className="text-muted">
                                                상태: <span className="text-yellow-400">{bid.auctionStatus}</span>
                                            </span>
                                            <span className="text-muted">
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

            <div className="flex justify-center gap-4 mt-8">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-card rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    이전
                </button>
                <span className="py-2 text-muted">Page {page + 1}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore && myBids.length < pageSize}
                    className="px-4 py-2 bg-card rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>
        </div>
    );
}
