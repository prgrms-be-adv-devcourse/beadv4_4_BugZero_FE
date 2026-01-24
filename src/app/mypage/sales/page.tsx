'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type MySale } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '미정';
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MySalesPage() {
    const router = useRouter();
    const { role } = useAuthStore();
    const [mySales, setMySales] = useState<MySale[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    // Hydration check to prevent premature redirect
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && role && role !== 'SELLER') {
            alert('판매자만 이용 가능한 메뉴입니다.');
            router.push('/mypage');
        }
    }, [role, router, mounted]);

    const loadSales = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const data = await api.getMySales("ALL", { page: pageNum, size: pageSize });
            if (data?.data) {
                setMySales(data.data);
                setHasMore(data.data.length === pageSize);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (role === 'SELLER') {
            loadSales(page);
        }
    }, [page, loadSales, role]);

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

    if (role !== 'SELLER') {
        return <div className="p-8 text-center text-gray-500">접근 권한이 없습니다.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-gray-800 rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">내 판매 내역</h1>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {mySales.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            판매 내역이 없습니다
                        </div>
                    ) : (
                        mySales.map(sale => {
                            const status = getSaleStatus(sale);
                            return (
                                <Link key={sale.auctionId} href={`/auctions/${sale.auctionId}`} className="block">
                                    <div className="card p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-[var(--lego-yellow)]/50 transition">
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
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    이전
                </button>
                <span className="py-2 text-gray-400">Page {page + 1}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore && mySales.length < pageSize}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>
        </div>
    );
}
