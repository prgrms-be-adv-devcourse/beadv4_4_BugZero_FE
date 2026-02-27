'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type MySale } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { parseDate, formatKSTDate } from '@/lib/utils';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    if (!dateString) return '미정';
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return '미정';
    return formatKSTDate(dateString, "MM/DD HH:mm");
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

    // Relist Modal State
    const [relistAuctionId, setRelistAuctionId] = useState<number | null>(null);
    const [relistForm, setRelistForm] = useState({
        startPrice: '',
        tickSize: '',
        durationDays: '3'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleWithdraw = async (auctionId: number) => {
        if (!confirm('정말 이 경매 판매를 포기하시겠습니까?')) return;

        try {
            await api.withdrawAuction(auctionId);
            toast.success('판매가 포기되었습니다.');
            setMySales(prev => prev.map(a =>
                a.auctionId === auctionId ? { ...a, auctionStatus: 'WITHDRAWN' } : a
            ));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '판매 포기에 실패했습니다.');
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        if (!confirm('정말 이 상품을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) return;

        try {
            await api.deleteProduct(productId);
            toast.success('상품이 삭제되었습니다.');
            loadSales(page);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '상품 삭제에 실패했습니다.');
        }
    };

    const submitRelist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!relistAuctionId) return;

        setIsSubmitting(true);
        try {
            await api.relistAuction(relistAuctionId, {
                startPrice: Number(relistForm.startPrice),
                tickSize: Number(relistForm.tickSize),
                durationDays: Number(relistForm.durationDays)
            });
            toast.success('경매가 재등록되었습니다.');
            setRelistAuctionId(null);
            loadSales(page); // Refresh current page
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '재등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSaleStatus = (sale: MySale) => {
        if (sale.inspectionStatus === 'PENDING') return { text: '검수 대기', color: 'text-orange-400' };
        if (sale.inspectionStatus === 'REJECTED') return { text: '검수 반려', color: 'text-red-500' };

        switch (sale.auctionStatus) {
            case 'IN_PROGRESS': return { text: '진행중', color: 'text-yellow-400' };
            case 'SCHEDULED': return { text: '예정', color: 'text-blue-400' };
            case 'RELISTED': return { text: '재경매', color: 'text-purple-400' };
            case 'WITHDRAWN': return { text: '판매 포기', color: 'text-muted' };
            case 'ENDED':
                return sale.tradeStatus === 'SUCCESS'
                    ? { text: '낙찰', color: 'text-green-500' }
                    : { text: '유찰', color: 'text-red-500' };
            default: return { text: '대기중', color: 'text-muted' };
        }
    };

    if (role !== 'SELLER') {
        return <div className="p-8 text-center text-muted">접근 권한이 없습니다.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-card rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">내 판매 내역</h1>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted">로딩 중...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {mySales.length === 0 ? (
                        <div className="text-center py-12 text-muted">
                            판매 내역이 없습니다
                        </div>
                    ) : (
                        mySales.map(sale => {
                            const status = getSaleStatus(sale);
                            return (
                                <Link key={sale.auctionId} href={`/auctions/${sale.auctionId}`} className="block">
                                    <div className="card p-4 bg-card border border-border rounded-xl hover:border-[var(--lego-yellow)]/50 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{sale.title || `경매 #${sale.auctionId}`}</p>
                                                <p className="text-sm text-muted">입찰 {sale.bidCount ?? 0}건</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${status.color}`}>
                                                    {status.text}
                                                </p>
                                                <p className="text-sm text-muted">
                                                    {(sale.bidCount ?? 0) > 0 ? `현재 ₩${formatPrice(sale.currentPrice ?? 0)}` : '입찰 없음'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                            <span className="text-xs text-muted">
                                                마감: {formatDate(sale.endTime)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 검수 대기 상태일 경우 수정/삭제 버튼 표시 */}
                                    {sale.inspectionStatus === 'PENDING' && (
                                        <div className="flex gap-2 mt-2" onClick={(e) => e.preventDefault()}>
                                            <button
                                                onClick={() => {
                                                    // 임시 단건 조회 부재 해결 우회용: 기본 정보를 Query에 실어 보냄
                                                    if (sale.productId) {
                                                        const qs = new URLSearchParams();
                                                        qs.set("edit", "true");
                                                        qs.set("productId", String(sale.productId));
                                                        qs.set("auctionId", String(sale.auctionId || ""));
                                                        qs.set("name", sale.title || "");
                                                        // MySaleResponseDto 에 description 이나 category 가 없는 한계 존재
                                                        // 이를 위해 백엔드 API 연동이 추후 필요하지만, 지금은 빈값으로 넘어가 다시 작성해야 할 수 있음

                                                        router.push(`/products/register?${qs.toString()}`);
                                                    }
                                                }}
                                                className="flex-1 bg-gray-800 text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-700 transition border border-gray-700 text-center"
                                            >
                                                상품 수정
                                            </button>
                                            <button
                                                onClick={() => sale.productId && handleDeleteProduct(sale.productId)}
                                                className="flex-1 bg-red-900/50 text-red-200 py-2 px-4 rounded-lg text-sm hover:bg-red-900 transition border border-red-900/50 text-center"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    )}

                                    {/* 유찰/실패 상태일 경우 하단에 액션 버튼 표시 */}
                                    {(sale.tradeStatus === 'FAILED' || (sale.auctionStatus === 'ENDED' && sale.bidCount === 0)) && (
                                        <div className="flex gap-2 mt-2" onClick={(e) => e.preventDefault()}>
                                            <button
                                                onClick={() => {
                                                    setRelistForm({
                                                        startPrice: String(sale.currentPrice || 0),
                                                        tickSize: '1000',
                                                        durationDays: '3'
                                                    });
                                                    setRelistAuctionId(sale.auctionId || null);
                                                }}
                                                className="flex-1 lego-btn text-sm py-2 px-4 text-black text-center"
                                            >
                                                재등록
                                            </button>
                                            <button
                                                onClick={() => handleWithdraw(sale.auctionId || 0)}
                                                className="flex-1 bg-gray-700 text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition text-center"
                                            >
                                                판매 포기
                                            </button>
                                        </div>
                                    )}
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
                    disabled={!hasMore && mySales.length < pageSize}
                    className="px-4 py-2 bg-card rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>

            {/* Relist Modal */}
            {relistAuctionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
                            <h2 className="text-xl font-bold text-foreground">경매 재등록</h2>
                            <button onClick={() => setRelistAuctionId(null)} className="text-muted hover:text-foreground p-1">✕</button>
                        </div>
                        <form onSubmit={submitRelist} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">새 시작가 (₩)</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    placeholder="예: 10000"
                                    className="w-full bg-gray-950/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 text-foreground"
                                    value={relistForm.startPrice}
                                    onChange={(e) => setRelistForm(prev => ({ ...prev, startPrice: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">입찰 단위 (₩)</label>
                                <input
                                    type="number"
                                    required
                                    min={100}
                                    placeholder="예: 1000"
                                    className="w-full bg-gray-950/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 text-foreground"
                                    value={relistForm.tickSize}
                                    onChange={(e) => setRelistForm(prev => ({ ...prev, tickSize: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">진행 기간 (일)</label>
                                <select
                                    required
                                    className="w-full bg-gray-950/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 text-foreground"
                                    value={relistForm.durationDays}
                                    onChange={(e) => setRelistForm(prev => ({ ...prev, durationDays: e.target.value }))}
                                >
                                    <option value="1">1일</option>
                                    <option value="3">3일</option>
                                    <option value="5">5일</option>
                                    <option value="7">7일</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setRelistAuctionId(null)} className="flex-1 py-3 bg-card text-gray-300 rounded-xl font-bold hover:bg-gray-700">취소</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50">
                                    {isSubmitting ? '처리중...' : '재등록 시작하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
