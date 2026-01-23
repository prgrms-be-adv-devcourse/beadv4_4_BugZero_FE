'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface InspectionModalProps {
    product: {
        ProductId: number;
        name: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function InspectionModal({ product, onClose, onSuccess }: InspectionModalProps) {
    const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
    const [condition, setCondition] = useState<'MISB' | 'NISB' | 'MISP' | 'USED'>('MISB');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. 검수 결과 등록
            await api.createProductInspection({
                productId: product.ProductId,
                status: status,
                productCondition: condition,
                reason: reason || undefined
            });

            // 2. 승인(APPROVED)인 경우에만 경매 시작 시간 결정 API 추가 호출
            if (status === 'APPROVED') {
                await api.determineStartAuction(product.ProductId);
            }

            alert('검수 처리가 완료되었습니다.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Inspection failed:', error);
            alert('검수 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111111] border border-[#222222] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-[#222222] flex justify-between items-center bg-gradient-to-r from-yellow-400/10 to-transparent">
                    <h2 className="text-xl font-bold text-white">상품 검수 처리</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">대상 상품</label>
                        <p className="text-lg font-medium text-white">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono">ID: {product.ProductId}</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-300">검수 결과</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setStatus('APPROVED')}
                                className={`py-3 rounded-xl font-bold transition-all border-2 ${status === 'APPROVED'
                                    ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                    : 'bg-[#1a1a1a] border-[#333333] text-gray-500 hover:border-gray-600'
                                    }`}
                            >
                                승인 (Pass)
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('REJECTED')}
                                className={`py-3 rounded-xl font-bold transition-all border-2 ${status === 'REJECTED'
                                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                    : 'bg-[#1a1a1a] border-[#333333] text-gray-500 hover:border-gray-600'
                                    }`}
                            >
                                반려 (Reject)
                            </button>
                        </div>
                    </div>

                    {status === 'APPROVED' && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-bold text-gray-300">상품 상태 등급</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['MISB', 'NISB', 'MISP', 'USED'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCondition(c as any)}
                                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${condition === c
                                            ? 'bg-yellow-400 text-black border-yellow-400'
                                            : 'bg-[#1a1a1a] border-[#333333] text-gray-500 hover:border-gray-600'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                                * MISB: Mint In Sealed Box, NISB: Near Inspection Sealed Box...
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">상세 의견</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={status === 'REJECTED' ? "반려 사유를 입력해주세요." : "추가 의견이 있다면 입력해주세요."}
                            className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-yellow-400 transition min-h-[100px] resize-none"
                            required={status === 'REJECTED'}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-[2] py-4 rounded-xl font-bold text-black transition-all ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : status === 'APPROVED'
                                    ? 'bg-yellow-400 hover:brightness-110 shadow-lg shadow-yellow-400/20'
                                    : 'bg-red-500 hover:brightness-110 text-white shadow-lg shadow-red-500/20'
                                }`}
                        >
                            {loading ? '처리 중...' : '검수 완료'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
