'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type WalletTransaction } from '@/lib/api';

type TransactionType = "TOPUP_DONE" | "DEPOSIT_HOLD" | "DEPOSIT_RELEASE" | "DEPOSIT_USED" | "DEPOSIT_FORFEITED" | "AUCTION_PAYMENT" | "REFUND_DONE" | "SETTLEMENT_PAID" | "SETTLEMENT_FEE" | "WITHDRAW_DONE";

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    TOPUP_DONE: '충전 완료',
    DEPOSIT_HOLD: '보증금 보류',
    DEPOSIT_RELEASE: '보증금 반환',
    DEPOSIT_USED: '보증금 사용',
    DEPOSIT_FORFEITED: '보증금 몰수',
    AUCTION_PAYMENT: '경매 결제',
    REFUND_DONE: '환불 완료',
    SETTLEMENT_PAID: '정산 지급',
    SETTLEMENT_FEE: '정산 수수료',
    WITHDRAW_DONE: '출금 완료',
};

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MyWalletPage() {
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    // Filter state
    const [filterType, setFilterType] = useState<TransactionType | ''>('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    // Withdraw modal state
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawError, setWithdrawError] = useState('');

    const loadTransactions = useCallback(async (pageNum: number, type?: TransactionType | '', from?: string, to?: string) => {
        setLoading(true);
        try {
            const data = await api.getWalletTransactions(
                pageNum,
                pageSize,
                type || undefined,
                from || undefined,
                to || undefined,
            );
            if (data) {
                setTransactions(data);
                setHasMore(data.length === pageSize);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransactions(page, filterType, filterFrom, filterTo);
    }, [page, filterType, filterFrom, filterTo, loadTransactions]);

    // 필터 변경 시 페이지 리셋
    const handleFilterTypeChange = (value: string) => {
        setFilterType(value as TransactionType | '');
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
        setFilterType('');
        setFilterFrom('');
        setFilterTo('');
        setPage(0);
    };

    const hasActiveFilters = filterType !== '' || filterFrom !== '' || filterTo !== '';

    const getTransactionSign = (tx: WalletTransaction) => {
        const balanceDelta = tx.balanceDelta ?? 0;
        const holdingDelta = tx.holdingDelta ?? 0;
        if (balanceDelta === 0 && holdingDelta !== 0) {
            return holdingDelta < 0;
        }
        return balanceDelta >= 0;
    };

    const getTransactionAmount = (tx: WalletTransaction) => {
        const balanceDelta = tx.balanceDelta ?? 0;
        const holdingDelta = tx.holdingDelta ?? 0;
        if (balanceDelta === 0 && holdingDelta !== 0) {
            return holdingDelta;
        }
        return balanceDelta;
    };

    // 출금 처리
    const handleWithdraw = async () => {
        const amount = Number(withdrawAmount);
        if (!amount || amount <= 0) {
            setWithdrawError('출금 금액을 올바르게 입력해주세요.');
            return;
        }

        const latestTx = transactions[0];
        const totalBalance = latestTx?.balance ?? 0;
        const holdingAmount = latestTx?.holdingAmount ?? 0;
        const availableBalance = totalBalance - holdingAmount;

        if (amount > availableBalance) {
            setWithdrawError(`사용 가능 잔액(₩${formatPrice(availableBalance)})을 초과할 수 없습니다.`);
            return;
        }

        setWithdrawLoading(true);
        setWithdrawError('');
        try {
            await api.withdrawDeposit(amount);
            alert('출금이 완료되었습니다.');
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setWithdrawError('');
            // 거래내역 새로고침
            setPage(0);
            loadTransactions(0, filterType, filterFrom, filterTo);
        } catch (error) {
            setWithdrawError(error instanceof Error ? error.message : '출금에 실패했습니다.');
        } finally {
            setWithdrawLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-card rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">내 지갑 / 거래내역</h1>
            </div>

            {loading && transactions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted">로딩 중...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.length > 0 && (() => {
                        const latestTx = transactions[0];
                        const totalBalance = latestTx?.balance ?? 0;
                        const holdingAmount = latestTx?.holdingAmount ?? 0;
                        const availableBalance = totalBalance - holdingAmount;
                        return (
                            <div className="card p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 mb-6">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <p className="text-sm text-muted mb-1">사용 가능</p>
                                        <p className="text-2xl font-bold text-yellow-400">
                                            ₩{formatPrice(availableBalance)}
                                        </p>
                                    </div>
                                    {holdingAmount > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted">보증금</p>
                                            <p className="text-sm text-muted">₩{formatPrice(holdingAmount)}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-border/50 text-xs text-muted">
                                    총 잔고: ₩{formatPrice(totalBalance)}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <Link href="/payment" className="block">
                            <div className="card p-4 text-center hover:border-[var(--lego-yellow)]/50 transition">
                                <p className="text-yellow-400 font-medium">💰 예치금 충전하기</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => {
                                setShowWithdrawModal(true);
                                setWithdrawAmount('');
                                setWithdrawError('');
                            }}
                            className="card p-4 text-center hover:border-red-500/50 transition cursor-pointer"
                        >
                            <p className="text-red-400 font-medium">💸 예치금 출금하기</p>
                        </button>
                    </div>

                    {/* 필터 영역 */}
                    <div className="card p-4 bg-card/80 border border-border rounded-xl mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-300">🔍 거래 필터</p>
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
                            {/* 거래 유형 필터 */}
                            <div>
                                <label className="block text-xs text-muted mb-1">거래 유형</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => handleFilterTypeChange(e.target.value)}
                                    className="w-full p-2 bg-card border border-border rounded-lg text-sm text-foreground focus:border-yellow-400 focus:outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">전체</option>
                                    {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => (
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
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-muted">
                            {hasActiveFilters ? '조건에 맞는 거래 내역이 없습니다' : '거래 내역이 없습니다'}
                        </div>
                    ) : (
                        transactions.map((tx) => {
                            const isPositive = getTransactionSign(tx);
                            return (
                                <div key={tx.id} className="card p-4 flex justify-between items-center bg-card border border-border rounded-xl">
                                    <div>
                                        <p className="font-medium">{tx.typeName || tx.type}</p>
                                        <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? '+' : '-'}₩{formatPrice(getTransactionAmount(tx))}
                                        </p>
                                        <p className="text-xs text-muted">잔액: ₩{formatPrice(tx.balance ?? 0)}</p>
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
                    disabled={!hasMore && transactions.length < pageSize}
                    className="px-4 py-2 bg-card rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>

            {/* 출금 모달 */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">예치금 출금</h2>

                        {transactions.length > 0 && (() => {
                            const latestTx = transactions[0];
                            const totalBalance = latestTx?.balance ?? 0;
                            const holdingAmount = latestTx?.holdingAmount ?? 0;
                            const availableBalance = totalBalance - holdingAmount;
                            return (
                                <div className="mb-4 p-3 bg-card rounded-lg text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted">사용 가능 잔액</span>
                                        <span className="text-yellow-400 font-semibold">₩{formatPrice(availableBalance)}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="mb-4">
                            <label className="block text-sm text-muted mb-2">출금 금액 (원)</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => {
                                    setWithdrawAmount(e.target.value);
                                    setWithdrawError('');
                                }}
                                placeholder="출금할 금액을 입력하세요"
                                className="w-full p-3 bg-card border border-gray-600 rounded-lg text-foreground focus:border-yellow-400 focus:outline-none"
                                min="1"
                                disabled={withdrawLoading}
                            />
                        </div>

                        {withdrawError && (
                            <p className="text-red-400 text-sm mb-4">{withdrawError}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawAmount('');
                                    setWithdrawError('');
                                }}
                                disabled={withdrawLoading}
                                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawLoading || !withdrawAmount}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition disabled:opacity-50"
                            >
                                {withdrawLoading ? '처리 중...' : '출금하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
