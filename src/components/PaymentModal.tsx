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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-2xl font-bold text-white">결제 및 배송지 정보</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-gray-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 bg-gray-800/30 border-b border-gray-800 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">결제 상품</p>
                        <p className="font-semibold text-gray-200 line-clamp-1">{productName}</p>
                    </div>
                    <div className="text-right ml-4">
                        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">최종 결제 금액</p>
                        <p className="text-2xl font-bold text-yellow-500 whitespace-nowrap">₩{new Intl.NumberFormat('ko-KR').format(finalPrice)}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">받는 분 성함</label>
                            <input
                                type="text"
                                name="receiverName"
                                required
                                placeholder="이름 입력"
                                className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-white transition-all placeholder:text-gray-600"
                                value={formData.receiverName}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">연락처</label>
                            <input
                                type="text"
                                name="phone"
                                required
                                placeholder="010-0000-0000"
                                className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-white transition-all placeholder:text-gray-600"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">우편번호</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                name="zipCode"
                                required
                                placeholder="우편번호"
                                className="w-1/3 bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-white transition-all placeholder:text-gray-600"
                                value={formData.zipCode}
                                onChange={handleChange}
                            />
                            {/* 향후 도로명 주소 검색 우편번호 API 연동을 위한 버튼 예약 */}
                            <button type="button" className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                                주소 검색
                            </button>
                        </div>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">주소</label>
                        <input
                            type="text"
                            name="address"
                            required
                            placeholder="기본 주소"
                            className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-white transition-all mb-3 placeholder:text-gray-600"
                            value={formData.address}
                            onChange={handleChange}
                        />
                        <input
                            type="text"
                            name="addressDetail"
                            placeholder="상세 주소를 입력해주세요"
                            className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-white transition-all placeholder:text-gray-600"
                            value={formData.addressDetail}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">배송 요청사항 <span className="text-gray-500 text-xs font-normal ml-1">(선택)</span></label>
                        <input
                            type="text"
                            name="message"
                            placeholder="ex) 문 앞에 놓아주세요"
                            className="w-full bg-gray-950/50 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 text-white transition-all placeholder:text-gray-600"
                            value={formData.message}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="pt-6 mt-2 border-t border-gray-800/50 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 hover:text-white transition-all"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
                        >
                            {submitting ? '처리중...' : '₩' + new Intl.NumberFormat('ko-KR').format(finalPrice) + ' 결제하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
