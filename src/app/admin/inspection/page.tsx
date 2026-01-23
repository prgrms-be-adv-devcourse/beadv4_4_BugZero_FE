'use client';

import { useState, useEffect } from 'react';
import { api, ProductResponseForInspectionDto } from '@/lib/api';
import toast from 'react-hot-toast';

type InspectionStatus = 'APPROVED' | 'REJECTED';
type ProductCondition = "INSPECTION" | "MISB" | "NISB" | "MISP" | "USED";

export default function InspectionPage() {
    const [products, setProducts] = useState<ProductResponseForInspectionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);

    // 모달 관리 상태
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [status, setStatus] = useState<InspectionStatus>('APPROVED');
    const [condition, setCondition] = useState<ProductCondition>('MISB');
    const [reason, setReason] = useState('');

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await api.getAdminProducts({ status: 'PENDING' }, { page: 0, size: 20 });
            setProducts(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error('검수 목록 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const openInspectionModal = (productId: number) => {
        setSelectedProductId(productId);
        setStatus('APPROVED'); // 기본값
        setCondition('MISB'); // 기본값
        setReason('');
    };

    const closeModal = () => {
        setSelectedProductId(null);
        setReason('');
    };

    const handleSubmit = async () => {
        if (!selectedProductId) return;

        // Validation
        if (status === 'REJECTED' && !reason.trim()) {
            toast.error('반려 사유를 입력해주세요.');
            return;
        }

        setProcessing(selectedProductId);
        try {
            // 1. 검수 결과 전송
            await api.createProductInspection({
                productId: selectedProductId,
                status: status,
                productCondition: condition,
                reason: reason // REJECTED일 때만 의미가 있지만, API가 허용한다면 APPROVED일 때도 보내도 무방 (빈 문자열)
            });

            // 2. 승인인 경우 경매 시작일 설정 API 호출
            if (status === 'APPROVED') {
                await api.determineStartAuction(selectedProductId);
                toast.success('검수 승인 및 경매 시작일이 설정되었습니다.');
            } else {
                toast.success('검수 반려 처리되었습니다.');
            }

            closeModal();
            loadProducts();
        } catch (error) {
            console.error(error);
            toast.error('처리 중 오류가 발생했습니다.');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">상품 검수 (관리자)</h1>

            {loading ? (
                <div className="text-center py-20 text-gray-500">로딩 중...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#111] rounded-xl">
                    검수 대기 중인 상품이 없습니다.
                </div>
            ) : (
                <div className="grid gap-4">
                    {products.map((product) => (
                        <div key={product.ProductId} className="bg-[#111] border border-gray-800 p-6 rounded-xl flex gap-6 items-center">
                            <div className="w-24 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {product.thumbnail ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">🧱</div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                                        {product.category}
                                    </span>
                                    <span className="text-xs text-gray-500">{product.sellerEmail}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                                <p className="text-sm text-gray-400">ID: {product.ProductId}</p>
                            </div>

                            <button
                                onClick={() => openInspectionModal(product.ProductId!)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-sm"
                            >
                                검수하기
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 검수 모달 */}
            {selectedProductId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] p-8 rounded-xl max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-white">검수 처리</h3>

                        {/* 상태 선택 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">판정 결과</label>
                            <div className="flex bg-[#111] p-1 rounded-lg">
                                <button
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition ${status === 'APPROVED' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    onClick={() => setStatus('APPROVED')}
                                >
                                    승인
                                </button>
                                <button
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition ${status === 'REJECTED' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    onClick={() => setStatus('REJECTED')}
                                >
                                    반려
                                </button>
                            </div>
                        </div>

                        {/* 승인 시: 상품 상태 선택 */}
                        {status === 'APPROVED' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">상품 등급 (Condition)</label>
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value as ProductCondition)}
                                    className="w-full bg-[#111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                                >
                                    <option value="MISB">MISB (미개봉 새상품)</option>
                                    <option value="NISB">NISB (봉인된 새상품)</option>
                                    <option value="MISP">MISP (봉지 미개봉)</option>
                                    <option value="USED">USED (중고)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    * 승인 즉시 경매 예정 상태로 변경되며 시작일이 설정됩니다.
                                </p>
                            </div>
                        )}

                        {/* 반려 시: 사유 입력 */}
                        {status === 'REJECTED' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">반려 사유</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="반려 사유를 상세히 입력해주세요."
                                    className="w-full bg-[#111] border border-gray-700 rounded-lg px-4 py-3 text-white h-32 resize-none focus:outline-none focus:border-red-500"
                                />
                            </div>
                        )}

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-white transition"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!!processing}
                                className={`flex-1 py-3 rounded-lg font-bold text-white transition disabled:opacity-50 ${status === 'APPROVED' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                            >
                                {processing ? '처리 중...' : '확인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
