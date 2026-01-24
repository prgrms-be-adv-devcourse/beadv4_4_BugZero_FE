'use client';

import { useState, useMemo } from 'react';
import { api } from '@/lib/api'; // API 모듈 임포트
import { getErrorMessage } from '@/api/utils';
import toast from 'react-hot-toast'; // ✅ 추가

interface VerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

type VerifyStep = 'input' | 'verify';

// 정규식 - 판매자 온보딩과 동일 (매 렌더링마다 재생성 방지를 위해 컴포넌트 외부로 이동)
const NAME_REGEX = /^[가-힣A-Za-z]{1,10}$/;
const PHONE_REGEX = /^01[016789]-\d{3,4}-\d{4}$/;

export default function VerifyModal({ isOpen, onClose, onVerified }: VerifyModalProps) {
    const [step, setStep] = useState<VerifyStep>('input');
    const [form, setForm] = useState({
        realName: '',
        contactPhone: '',
        verifyCode: ''
    });
    const [loading, setLoading] = useState(false);

    const isValidInput = useMemo(() => {
        return NAME_REGEX.test(form.realName) && PHONE_REGEX.test(form.contactPhone);
    }, [form.realName, form.contactPhone]);

    // 전화번호 하이픈 자동 생성
    const formatPhone = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    // 인증번호 발송 (Mock)
    const handleSendCode = async () => {
        if (!isValidInput) return;
        setLoading(true);
        try {
            // 실제 환경에서는 여기서 SMS 발송 API 호출
            await new Promise(resolve => setTimeout(resolve, 800));
            setStep('verify');
        } catch {
            toast.error('인증번호 발송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 최종 본인인증 제출
    const handleSubmit = async () => {
        if (form.verifyCode !== '123456') {
            toast.error('인증번호가 올바르지 않습니다. (테스트용: 123456)');
            return;
        }

        setLoading(true);
        try {
            // ✅ BE API 연동: 실명 및 연락처 업데이트
            const rawPhone = form.contactPhone.replace(/[^\d]/g, '');
            await api.updateIdentity({
                realName: form.realName.trim(),
                contactPhone: rawPhone
            });

            toast.success('본인 인증 정보가 성공적으로 등록되었습니다.');
            onVerified(); // 부모 컴포넌트 정보 갱신 (loadMember 호출)
            onClose();
        } catch (error: unknown) {
            const message = getErrorMessage(error, '인증에 실패했습니다. 다시 시도해주세요.');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-[#0d0d0d] rounded-3xl p-8 max-w-md w-full border border-gray-800 shadow-2xl transition-all scale-100">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">본인인증</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        안전한 경매 참여를 위해<br />
                        본인인증이 필요합니다.
                    </p>
                </div>

                {step === 'input' ? (
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-gray-500 ml-1">이름 (실명)</label>
                            <input
                                type="text"
                                value={form.realName}
                                onChange={(e) => setForm({ ...form, realName: e.target.value })}
                                placeholder="성함을 입력해주세요"
                                className={`w-full bg-[#1a1a1a] border ${form.realName && !NAME_REGEX.test(form.realName) ? 'border-red-500/50' : 'border-[#262626]'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                            />
                            {form.realName && !NAME_REGEX.test(form.realName) && (
                                <p className="text-[10px] text-red-400 ml-1">한글 또는 영문 1-10자로 입력해주세요.</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-gray-500 ml-1">휴대폰 번호</label>
                            <input
                                type="tel"
                                value={form.contactPhone}
                                onChange={(e) => setForm({ ...form, contactPhone: formatPhone(e.target.value) })}
                                placeholder="010-0000-0000"
                                maxLength={13}
                                className={`w-full bg-[#1a1a1a] border ${form.contactPhone && !PHONE_REGEX.test(form.contactPhone) ? 'border-red-500/50' : 'border-[#262626]'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-900 text-gray-400 py-4 rounded-xl hover:bg-gray-800 transition font-bold"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSendCode}
                                disabled={loading || !isValidInput}
                                className="flex-[1.5] bg-yellow-500 py-4 rounded-xl text-black font-black hover:bg-yellow-400 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10"
                            >
                                {loading ? '발송 중...' : '인증번호 받기'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-2">
                            <p className="text-blue-400 text-xs text-center leading-relaxed font-medium">
                                📱 {form.contactPhone} 번호로<br />인증번호가 발송되었습니다.
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-gray-500 ml-1">인증번호</label>
                            <input
                                type="text"
                                value={form.verifyCode}
                                onChange={(e) => setForm({ ...form, verifyCode: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })}
                                placeholder="6자리 숫자 입력"
                                maxLength={6}
                                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:border-yellow-500 transition-all"
                            />
                        </div>
                        <p className="text-center text-[11px] text-gray-600">
                            테스트용 인증번호: <span className="text-yellow-500/70 font-bold">123456</span>
                        </p>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setStep('input')}
                                className="flex-1 bg-gray-900 text-gray-400 py-4 rounded-xl hover:bg-gray-800 transition font-bold"
                            >
                                재입력
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || form.verifyCode.length !== 6}
                                className="flex-[1.5] bg-yellow-500 py-4 rounded-xl text-black font-black hover:bg-yellow-400 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10"
                            >
                                {loading ? '확인 중...' : '인증 완료'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}