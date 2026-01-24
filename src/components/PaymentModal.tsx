'use client';

import { useState } from 'react';
import type { components } from '@/api/schema';

type AuctionFinalPaymentRequestDto = components['schemas']['AuctionFinalPaymentRequestDto'];

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AuctionFinalPaymentRequestDto) => Promise<void>;
    productName: string;
    finalPrice: number;
    auctionId: number;
}

export default function PaymentModal({ isOpen, onClose, onSubmit, productName, finalPrice, auctionId }: PaymentModalProps) {
    const [formData, setFormData] = useState<AuctionFinalPaymentRequestDto>({
        receiverName: '',
        phone: '',
        zipCode: '',
        address: '',
        addressDetail: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            // Error handling is done by the parent or global handler, but we stop loading here
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">결제 및 배송지 정보</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
                </div>

                <div className="p-6 bg-gray-800/50">
                    <p className="text-sm text-gray-400 mb-1">상품명</p>
                    <p className="font-semibold mb-2">{productName}</p>
                    <p className="text-sm text-gray-400 mb-1">최종 결제 금액</p>
                    <p className="text-xl font-bold text-yellow-400">₩{new Intl.NumberFormat('ko-KR').format(finalPrice)}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">받는 분 성함</label>
                        <input
                            type="text"
                            name="receiverName"
                            required
                            className="w-full bg-gray-800 border-gray-700 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 text-white"
                            value={formData.receiverName}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">연락처</label>
                        <input
                            type="text"
                            name="phone"
                            required
                            placeholder="010-0000-0000"
                            className="w-full bg-gray-800 border-gray-700 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 text-white"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">우편번호</label>
                            <input
                                type="text"
                                name="zipCode"
                                required
                                className="w-full bg-gray-800 border-gray-700 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 text-white"
                                value={formData.zipCode}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">주소</label>
                        <input
                            type="text"
                            name="address"
                            required
                            className="w-full bg-gray-800 border-gray-700 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 text-white mb-2"
                            value={formData.address}
                            onChange={handleChange}
                        />
                        <input
                            type="text"
                            name="addressDetail"
                            placeholder="상세주소 입력"
                            className="w-full bg-gray-800 border-gray-700 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 text-white"
                            value={formData.addressDetail}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">배송 요청사항</label>
                        <input
                            type="text"
                            name="message"
                            className="w-full bg-gray-800 border-gray-700 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 text-white"
                            value={formData.message}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 bg-[var(--lego-yellow)] text-black rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-50"
                        >
                            {submitting ? '처리중...' : '결제하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
