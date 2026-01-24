'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type MyAuctionOrder } from '@/lib/api';
import PaymentModal from '@/components/PaymentModal';
import toast from 'react-hot-toast';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price);
}

function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MyOrdersPage() {
    const [myOrders, setMyOrders] = useState<MyAuctionOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    // Payment Modal State
    const [selectedOrder, setSelectedOrder] = useState<MyAuctionOrder | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const loadOrders = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const data = await api.getMyAuctionOrders(undefined, { page: pageNum, size: pageSize });
            if (data?.data) {
                setMyOrders(data.data);
                setHasMore(data.data.length === pageSize);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders(page);
    }, [page, loadOrders]);

    const handleOpenPayment = (e: React.MouseEvent, order: MyAuctionOrder) => {
        e.preventDefault(); // Link 이동 방지
        e.stopPropagation();
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mypage" className="p-2 hover:bg-gray-800 rounded-full transition text-2xl">
                    ←
                </Link>
                <h1 className="text-2xl font-bold">내 낙찰(주문) 내역</h1>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {myOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            낙찰받은 내역이 없습니다
                        </div>
                    ) : (
                        myOrders.map(order => {
                            // Check if payment is needed: status is PROCESSING (which maps to 'WAITING' broadly, but checking correct enum helps)
                            // Based on schema: orderStatus?: "PROCESSING" | "SUCCESS" | "FAILED"
                            const canPay = order.orderStatus === 'PROCESSING';

                            return (
                                <Link key={order.orderId} href={`/auctions/${order.auctionId}`}>
                                    <div className="card p-4 hover:border-[var(--lego-yellow)]/50 transition bg-gray-900 border border-gray-800 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{order.productName || `낙찰 경매 #${order.auctionId}`}</p>
                                                <p className="text-sm text-gray-500">낙찰가: ₩{formatPrice(order.finalPrice ?? 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${order.orderStatus === 'SUCCESS' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                    {order.statusDescription || (order.orderStatus === 'SUCCESS' ? '결제 완료' : '진행 중')}
                                                </p>
                                                <p className="text-xs text-gray-400">{formatDate(order.tradeDate)}</p>
                                            </div>
                                        </div>

                                        {/* Payment Button */}
                                        {canPay && (
                                            <div className="mt-4 pt-3 border-t border-gray-800 text-right">
                                                <button
                                                    onClick={(e) => handleOpenPayment(e, order)}
                                                    className="px-4 py-2 bg-[var(--lego-yellow)] text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition shadow-lg shadow-yellow-400/20"
                                                >
                                                    결제하기
                                                </button>
                                            </div>
                                        )}
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
                    disabled={!hasMore && myOrders.length < pageSize}
                    className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
                >
                    다음
                </button>
            </div>

            {/* Payment Modal */}
            {selectedOrder && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    auctionId={selectedOrder.auctionId ?? 0}
                    productName={selectedOrder.productName ?? '알 수 없는 상품'}
                    finalPrice={selectedOrder.finalPrice ?? 0}
                    onSubmit={async (formData) => {
                        if (!selectedOrder.auctionId) return;
                        try {
                            await api.auctionFinalPayment(selectedOrder.auctionId, formData);
                            toast.success('결제가 완료되었습니다.');
                            loadOrders(page); // Reload list to update status
                        } catch (error: any) {
                            toast.error(error.message || '결제 처리에 실패했습니다.');
                            throw error; // Re-throw to handle loading state in modal
                        }
                    }}
                />
            )}
        </div>
    );
}
