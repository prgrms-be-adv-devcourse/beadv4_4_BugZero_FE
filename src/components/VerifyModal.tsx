'use client';

import { useState } from 'react';
import { api } from '@/lib/api'; // API 모듈 임포트
import { getErrorMessage } from '@/api/utils';

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

    // 전화번호 하이픈 자동 생성 로직
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

        // 하이픈 제거 후 숫자만 추출
        const rawPhone = form.contactPhone.replace(/[^\d]/g, '');
        if (rawPhone.length < 10) {
            alert('전화번호를 정확히 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            // ✅ BE API 연동: 실명 및 연락처 업데이트
            await api.updateIdentity({
                realName: form.realName.trim(),
                contactPhone: rawPhone
            });

            alert('본인 인증 정보가 성공적으로 등록되었습니다.');
            onVerified(); // 부모 컴포넌트 정보 갱신 (loadMember 호출)
            onClose();
        } catch (error: unknown) {
            const message = getErrorMessage(error, '인증에 실패했습니다. 다시 시도해주세요.');
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-[#0d0d0d] rounded-2xl p-8 max-w-md w-full border border-[#1a1a1a]">
                {/* 헤더 */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">본인인증</h3>
                    <p className="text-gray-400 text-sm">
                        판매 등록 및 경매 참여를 위해<br />실명과 연락처 등록이 필요합니다.
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                    <p className="text-blue-400 text-[11px] leading-relaxed">
                        ℹ️ 입력하신 실명 정보는 정산 시 예금주명 확인 등에 사용되며, 타인에게는 노출되지 않습니다.
                    </p>
                </div>

                {/* 폼 */}
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 ml-1">실명</label>
                        <input
                            type="text"
                            value={form.realName}
                            onChange={(e) => setForm({ ...form, realName: e.target.value })}
                            placeholder="성함을 입력해주세요"
                            className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5 ml-1">휴대폰 번호</label>
                        <input
                            type="tel"
                            value={form.contactPhone}
                            onChange={(e) => setForm({ ...form, contactPhone: formatPhone(e.target.value) })}
                            placeholder="010-0000-0000"
                            maxLength={13}
                            className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-500 transition"
                        />
                    </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-[#1a1a1a] text-gray-400 py-4 rounded-xl hover:bg-[#262626] transition font-medium"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.realName || !form.contactPhone}
                        className="flex-1 bg-yellow-500 py-4 rounded-xl text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '처리 중...' : '인증 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
}