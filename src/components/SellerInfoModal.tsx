'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/api/utils';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

export default function SellerInfoModal({ isOpen, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        zipCode: '',
        address: '',
        addressDetail: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.updateMemberInfo({
                zipCode: form.zipCode,
                address: form.address,
                addressDetail: form.addressDetail,
            });

            toast.success("판매 정보가 성공적으로 등록되었습니다.");
            onUpdated();
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "정보 저장에 실패했습니다."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
                <h2 className="text-xl font-bold text-foreground mb-2">판매자 추가 정보</h2>
                <p className="text-muted text-sm mb-6">물품 수거 및 정산을 위해 주소 정보가 필요합니다.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <label className="block text-xs text-muted mb-1.5 ml-1">우편번호</label>
                            <input
                                placeholder="00000"
                                required
                                className="w-full bg-card border border-[#262626] rounded-lg px-4 py-3 text-foreground focus:border-yellow-500 outline-none transition"
                                value={form.zipCode}
                                onChange={e => setForm({ ...form, zipCode: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 text-[11px] text-muted flex items-end pb-2">
                            * 배송 및 정산의 기준이 됩니다.
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-muted mb-1.5 ml-1">기본 주소</label>
                        <input
                            placeholder="주소를 입력해주세요"
                            required
                            className="w-full bg-card border border-[#262626] rounded-lg px-4 py-3 text-foreground focus:border-yellow-500 outline-none transition"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-muted mb-1.5 ml-1">상세 주소</label>
                        <input
                            placeholder="상세 주소를 입력해주세요"
                            required
                            className="w-full bg-card border border-[#262626] rounded-lg px-4 py-3 text-foreground focus:border-yellow-500 outline-none transition"
                            value={form.addressDetail}
                            onChange={e => setForm({ ...form, addressDetail: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-card text-muted rounded-xl font-medium hover:bg-muted transition"
                        >
                            나중에 하기
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition disabled:opacity-50"
                        >
                            {loading ? '저장 중...' : '정보 저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}