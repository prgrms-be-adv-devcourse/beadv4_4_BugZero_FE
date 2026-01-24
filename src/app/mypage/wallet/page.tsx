'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type WalletTransaction } from '@/lib/api';

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

    const loadTransactions = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const data = await api.getWalletTransactions(pageNum, pageSize);
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
        loadTransactions(page);
    }, [page, loadTransactions]);

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

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-gray-800 rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">내 지갑 / 거래내역</h1>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">로딩 중...</p>
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
                                        <p className="text-sm text-gray-400 mb-1">사용 가능</p>
                                        <p className="text-2xl font-bold text-yellow-400">
                                            ₩{formatPrice(availableBalance)}
                                        </p>
                                    </div>
                                    {holdingAmount > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">보증금</p>
                                            <p className="text-sm text-gray-400">₩{formatPrice(holdingAmount)}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-gray-700/50 text-xs text-gray-500">
                                    총 잔고: ₩{formatPrice(totalBalance)}
                                </div>
                            </div>
                        );
                    })()}

                    <Link href="/payment" className="block mb-4">
                        <div className="card p-4 text-center hover:border-[var(--lego-yellow)]/50 transition">
                            <p className="text-yellow-400 font-medium">💰 예치금 충전하기</p>
                        </div>
                    </Link>

                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            거래 내역이 없습니다
                        </div>
                    ) : (
                        transactions.map((tx) => {
                            const isPositive = getTransactionSign(tx);
                            return (
                                <div key={tx.id} className="card p-4 flex justify-between items-center bg-gray-900 border border-gray-800 rounded-xl">
                                    <div>
                                        <p className="font-medium">{tx.typeName || tx.type}</p>
                                        <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? '+' : '-'}₩{formatPrice(getTransactionAmount(tx))}
                                        </p>
                                        <p className="text-xs text-gray-500">잔액: ₩{formatPrice(tx.balance ?? 0)}</p>
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
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    이전
                </button>
                <span className="py-2 text-gray-400">Page {page + 1}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore && transactions.length < pageSize}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>
        </div>
    );
}
