'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type Settlement } from '@/lib/api';
import { parseDate, formatKSTDate } from '@/lib/utils';

type SettlementStatus = "READY" | "DONE" | "CANCELED" | "FAILED";

const STATUS_LABELS: Record<SettlementStatus, string> = {
    READY: '정산 대기',
    DONE: '정산 완료',
    CANCELED: '취소',
    FAILED: '실패',
};

const STATUS_COLORS: Record<SettlementStatus, string> = {
    READY: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    DONE: 'bg-green-500/20 text-green-400 border-green-500/30',
    CANCELED: 'bg-gray-500/20 text-muted border-gray-500/30',
    FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    return formatKSTDate(dateString, "YYYY-MM-DD HH:mm");
}

export default function SettlementsPage() {
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    // Filter state
    const [filterStatus, setFilterStatus] = useState<SettlementStatus | ''>('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    const loadSettlements = useCallback(async (pageNum: number, status?: SettlementStatus | '', from?: string, to?: string) => {
        setLoading(true);
        try {
            const data = await api.getSettlements(
                pageNum,
                pageSize,
                status || undefined,
                from || undefined,
                to || undefined,
            );
            if (data) {
                setSettlements(data);
                setHasMore(data.length === pageSize);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettlements(page, filterStatus, filterFrom, filterTo);
    }, [page, filterStatus, filterFrom, filterTo, loadSettlements]);

    // 필터 변경 시 페이지 리셋
    const handleFilterStatusChange = (value: string) => {
        setFilterStatus(value as SettlementStatus | '');
        setPage(0);
    };

    const handleFilterFromChange = (value: string) => {
        setFilterFrom(value);
        setPage(0);
    };

    const handleFilterToChange = (value: string) => {
        setFilterTo(value);
        setPage(0);
    };

    const handleResetFilters = () => {
        setFilterStatus('');
        setFilterFrom('');
        setFilterTo('');
        setPage(0);
    };

    const hasActiveFilters = filterStatus !== '' || filterFrom !== '' || filterTo !== '';

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-card rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">정산 관리</h1>
            </div>

            {loading && settlements.length === 0 ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted">로딩 중...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* 필터 영역 */}
                    <div className="card p-4 bg-card/80 border border-border rounded-xl mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-300">🔍 정산 필터</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleResetFilters}
                                    className="text-xs text-yellow-400 hover:text-yellow-300 transition"
                                >
                                    필터 초기화
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* 상태 필터 */}
                            <div>
                                <label className="block text-xs text-muted mb-1">정산 상태</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => handleFilterStatusChange(e.target.value)}
                                    className="w-full p-2 bg-card border border-border rounded-lg text-sm text-foreground focus:border-yellow-400 focus:outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">전체</option>
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            {/* 시작일 */}
                            <div>
                                <label className="block text-xs text-muted mb-1">시작일</label>
                                <input
                                    type="date"
                                    value={filterFrom}
                                    onChange={(e) => handleFilterFromChange(e.target.value)}
                                    className="w-full p-2 bg-card border border-border rounded-lg text-sm text-foreground focus:border-yellow-400 focus:outline-none cursor-pointer"
                                />
                            </div>
                            {/* 종료일 */}
                            <div>
                                <label className="block text-xs text-muted mb-1">종료일</label>
                                <input
                                    type="date"
                                    value={filterTo}
                                    onChange={(e) => handleFilterToChange(e.target.value)}
                                    className="w-full p-2 bg-card border border-border rounded-lg text-sm text-foreground focus:border-yellow-400 focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-muted text-sm">조회 중...</p>
                        </div>
                    ) : settlements.length === 0 ? (
                        <div className="text-center py-12 text-muted">
                            {hasActiveFilters ? '조건에 맞는 정산 내역이 없습니다' : '정산 내역이 없습니다'}
                        </div>
                    ) : (
                        settlements.map((s) => {
                            const status = (s.status || 'READY') as SettlementStatus;
                            return (
                                <div key={s.id} className="card p-4 bg-card border border-border rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{s.productName || '상품명 없음'}</p>
                                            <p className="text-xs text-muted mt-0.5">{formatDate(s.createdAt)}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ml-3 whitespace-nowrap ${STATUS_COLORS[status] || STATUS_COLORS.READY}`}>
                                            {STATUS_LABELS[status] || status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                                        <div>
                                            <p className="text-xs text-muted">판매금액</p>
                                            <p className="text-sm font-semibold text-foreground">₩{formatPrice(s.salesAmount ?? 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted">수수료</p>
                                            <p className="text-sm font-semibold text-red-400">-₩{formatPrice(s.feeAmount ?? 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted">정산금액</p>
                                            <p className="text-sm font-semibold text-green-400">₩{formatPrice(s.settlementAmount ?? 0)}</p>
                                        </div>
                                    </div>
                                </div>
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
                    disabled={!hasMore && settlements.length < pageSize}
                    className="px-4 py-2 bg-card rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>
        </div>
    );
}
