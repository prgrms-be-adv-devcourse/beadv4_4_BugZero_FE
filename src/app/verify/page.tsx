'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type VerifyStep = 'input' | 'verify' | 'complete';

export default function VerifyPage() {
    const router = useRouter();
    const [step, setStep] = useState<VerifyStep>('input');
    const [form, setForm] = useState({
        name: '',
        phone: '',
        verifyCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);


    // 인증번호 발송
    const handleSendCode = async () => {
        if (!form.name || !form.phone) {
            alert('이름과 전화번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            // TODO: BE API 연동 시 실제 SMS 발송
            await new Promise(resolve => setTimeout(resolve, 1000));
            setCodeSent(true);
            setStep('verify');
            setCountdown(180); // 3분

            // 카운트다운 시작
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch {

            alert('인증번호 발송에 실패했습니다.');

        } finally {
            setLoading(false);
        }
    };

    // 인증 확인
    const handleVerify = async () => {
        if (!form.verifyCode) {
            alert('인증번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            // TODO: BE API 연동 시 실제 인증 확인
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock: 123456이면 성공
            if (form.verifyCode === '123456') {
                setStep('complete');
            } else {
                alert('인증번호가 올바르지 않습니다.');
            }
        } catch {

            alert('인증에 실패했습니다.');

        } finally {
            setLoading(false);
        }
    };

    // 포맷 함수
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md">
                <Link href="/mypage" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-6">
                    ← 마이페이지
                </Link>

                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                    {/* 헤더 */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">본인인증</h1>
                        <p className="text-gray-400 mt-2">
                            입찰 및 판매를 위해 본인인증이 필요합니다
                        </p>
                    </div>

                    {/* 스텝 인디케이터 */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {['input', 'verify', 'complete'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${step === s
                                    ? 'bg-yellow-500 text-black'
                                    : ['input', 'verify', 'complete'].indexOf(step) > i
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-700 text-gray-400'
                                    }`}>
                                    {['input', 'verify', 'complete'].indexOf(step) > i ? '✓' : i + 1}
                                </div>
                                {i < 2 && (
                                    <div className={`w-8 h-0.5 ${['input', 'verify', 'complete'].indexOf(step) > i
                                        ? 'bg-green-500'
                                        : 'bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: 입력 */}
                    {step === 'input' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">이름</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="실명을 입력해주세요"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">휴대폰 번호</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                                    placeholder="010-0000-0000"
                                    maxLength={13}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                                />
                            </div>
                            <button
                                onClick={handleSendCode}
                                disabled={loading || !form.name || !form.phone}
                                className="w-full lego-btn py-4 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '발송 중...' : '인증번호 발송'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: 인증 */}
                    {step === 'verify' && (
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                                <p className="text-blue-400 text-sm">
                                    📱 {form.phone}으로 인증번호가 발송되었습니다.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    인증번호
                                    {countdown > 0 && (
                                        <span className="text-yellow-400 ml-2">{formatTime(countdown)}</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={form.verifyCode}
                                    onChange={(e) => setForm({ ...form, verifyCode: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })}
                                    placeholder="6자리 숫자"
                                    maxLength={6}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setStep('input'); setCodeSent(false); }}
                                    className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition"
                                >
                                    다시 입력
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={loading || form.verifyCode.length !== 6}
                                    className="flex-1 lego-btn py-3 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? '확인 중...' : '인증 확인'}
                                </button>
                            </div>
                            <p className="text-center text-sm text-gray-500">
                                테스트용 인증번호: <span className="text-yellow-400">123456</span>
                            </p>
                        </div>
                    )}

                    {/* Step 3: 완료 */}
                    {step === 'complete' && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">✓</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">인증 완료!</h2>
                            <p className="text-gray-400 mb-6">
                                본인인증이 완료되었습니다.<br />
                                이제 입찰 및 판매가 가능합니다.
                            </p>
                            <button
                                onClick={() => router.push('/mypage')}
                                className="w-full lego-btn py-4 text-black font-bold"
                            >
                                마이페이지로 이동
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
