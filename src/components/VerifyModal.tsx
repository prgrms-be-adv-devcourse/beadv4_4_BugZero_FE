'use client';

import { useState } from 'react';

interface VerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

export default function VerifyModal({ isOpen, onClose, onVerified }: VerifyModalProps) {
    const [form, setForm] = useState({
        realName: '',
        contactPhone: ''
    });
    const [loading, setLoading] = useState(false);

    const formatPhone = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handleSubmit = async () => {
        if (!form.realName.trim()) {
            alert('실명을 입력해주세요.');
            return;
        }
        if (form.contactPhone.replace(/[^\d]/g, '').length < 10) {
            alert('전화번호를 정확히 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            // TODO: BE API 연동 - 프로필 업데이트
            // await api.updateProfile({
            //     realName: form.realName,
            //     contactPhone: form.contactPhone.replace(/-/g, '')
            // });

            // Mock: 1초 후 성공
            await new Promise(resolve => setTimeout(resolve, 1000));

            onVerified();
            onClose();
        } catch (error) {
            alert('인증에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
                {/* 헤더 */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">본인인증 필요</h3>
                    <p className="text-gray-400 text-sm">
                        입찰 및 거래를 위해 본인인증이 필요합니다.
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
                    <p className="text-blue-400 text-xs">
                        ℹ️ 입력하신 정보는 거래 안전을 위해 사용되며, 다른 사용자에게는 마스킹되어 표시됩니다.
                    </p>
                </div>

                {/* 폼 */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">실명</label>
                        <input
                            type="text"
                            value={form.realName}
                            onChange={(e) => setForm({ ...form, realName: e.target.value })}
                            placeholder="홍길동"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">휴대폰 번호</label>
                        <input
                            type="tel"
                            value={form.contactPhone}
                            onChange={(e) => setForm({ ...form, contactPhone: formatPhone(e.target.value) })}
                            placeholder="010-1234-5678"
                            maxLength={13}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                        />
                    </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition"
                    >
                        나중에
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.realName || !form.contactPhone}
                        className="flex-1 lego-btn py-3 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '처리 중...' : '인증하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
