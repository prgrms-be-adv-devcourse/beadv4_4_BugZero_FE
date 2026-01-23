'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { authApi } from '@/api/auth';
import type { components } from '@/api/schema';

type MemberInfo = components['schemas']['MemberMeResponseDto'];
type OnboardingStep = 'intro' | 'identity' | 'address' | 'complete';

export default function SellerOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>('intro');
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // 본인인증 폼
    const [identityForm, setIdentityForm] = useState({
        realName: '',
        contactPhone: '',
        verifyCode: ''
    });
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verifyError, setVerifyError] = useState('');

    // 주소 폼
    const [addressForm, setAddressForm] = useState({
        zipCode: '',
        address: '',
        addressDetail: ''
    });

    // 유효성 검사 - 완성형 한글(가-힣) + 영문만, 1-10자
    const errors = useMemo(() => {
        // 완성형 한글 또는 영문만 허용 (자음/모음만 있는 건 불허)
        const nameRegex = /^[가-힣A-Za-z]{1,10}$/;
        // 01X-XXXX-XXXX 형식 (010, 011, 016, 017, 018, 019)
        const phoneRegex = /^01[016789]-\d{3,4}-\d{4}$/;
        const zipCodeRegex = /^\d{5}$/;

        return {
            realName: identityForm.realName.length > 0 && !nameRegex.test(identityForm.realName),
            contactPhone: identityForm.contactPhone.length > 0 && !phoneRegex.test(identityForm.contactPhone),
            zipCode: addressForm.zipCode.length > 0 && !zipCodeRegex.test(addressForm.zipCode),
            address: addressForm.address.length > 0 && addressForm.address.length < 5
        };
    }, [identityForm.realName, identityForm.contactPhone, addressForm.zipCode, addressForm.address]);

    // 회원 정보 로드
    const loadMember = useCallback(async () => {
        try {
            const info = await api.getMe();
            if (info) {
                setMemberInfo(info);
                // 이미 판매자인 경우 바로 상품 등록 페이지로 이동
                if (info.role === 'SELLER') {
                    router.replace('/products/register');
                    return;
                }
            }
        } catch {
            router.push('/login');
        } finally {
            setPageLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadMember();
    }, [loadMember]);

    // 인증번호 발송
    const handleSendCode = async () => {
        if (errors.realName || errors.contactPhone || !identityForm.realName || !identityForm.contactPhone) {
            return;
        }
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setCodeSent(true);
            setCountdown(180);
            setVerifyError('');

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
            // 에러 처리
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyIdentity = async () => {
        if (identityForm.verifyCode !== '123456') {
            setVerifyError('인증번호가 올바르지 않습니다');
            return;
        }
        setLoading(true);
        setVerifyError('');
        try {
            await api.updateIdentity({
                realName: identityForm.realName,
                contactPhone: identityForm.contactPhone.replace(/-/g, '')
            });
            await loadMember();
            setStep('address');
        } catch (error) {
            console.error(error);
            setVerifyError('본인인증에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddressAndComplete = async () => {
        if (errors.zipCode || !addressForm.zipCode || !addressForm.address) {
            return;
        }
        setLoading(true);
        try {
            // 1. 주소 저장
            await api.updateMe({
                zipCode: addressForm.zipCode,
                address: addressForm.address,
                addressDetail: addressForm.addressDetail
            });

            // 2. 판매자 등록
            await api.promoteSeller();

            // 3. 토큰 갱신 (Role 변경 반영)
            await authApi.refreshAccessToken();

            // 4. 완료 후 바로 상품 등록으로 이동 (강제 새로고침)
            window.location.href = '/products/register';
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const steps: { key: OnboardingStep; label: string }[] = [
        { key: 'intro', label: '정책' },
        { key: 'identity', label: '인증' },
        { key: 'address', label: '주소' },
        { key: 'complete', label: '완료' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-yellow-400 transition-all font-medium mb-8">
                    ← 홈으로 돌아가기
                </Link>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-12 relative px-2">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-800 -z-10" />
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-yellow-500 transition-all duration-500 -z-10"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((s, i) => (
                        <div key={s.key} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-4 ${currentStepIndex > i
                                ? 'bg-green-500 border-green-500/20 text-white'
                                : currentStepIndex === i
                                    ? 'bg-yellow-500 border-yellow-500/20 text-black'
                                    : 'bg-gray-800 border-gray-900 text-gray-500'
                                }`}>
                                {currentStepIndex > i ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs font-medium ${currentStepIndex >= i ? 'text-white' : 'text-gray-600'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: 정책 안내 */}
                {step === 'intro' && (
                    <div>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-extrabold text-white mb-3">RareGo 판매자 정책</h1>
                            <p className="text-gray-400">투명하고 공정한 경매 문화를 함께 만들어가요</p>
                        </div>

                        <div className="grid gap-4 mb-10">
                            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">💰</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">합리적인 10% 수수료</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            정식 판매 낙찰 시에만 <span className="text-yellow-400 font-bold">낙찰가의 10%</span>가 수수료로 발생합니다.
                                            경매가 유찰될 경우 판매자가 부담하는 비용은 <span className="text-white font-bold">0원</span>입니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🛡️</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">판매자 보호 (보증금 보상)</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            낙찰자가 정당한 사유 없이 결제를 거부할 경우, 낙찰자가 예치한 <span className="text-blue-400 font-bold">보증금 전액</span>을 판매자에게 보상금으로 지급합니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🤝</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">검수 기반 직거래</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            본사 정밀 검수를 통과한 상품만 경매가 진행됩니다.
                                            검수 완료 후 시스템에서 경매가 자동 시작되어 편리합니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('identity')}
                            className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black text-lg hover:bg-yellow-400 transition-all"
                        >
                            정책 동의 및 판매 시작하기
                        </button>
                    </div>
                )}

                {/* Step 2: 본인인증 */}
                {step === 'identity' && (
                    <div className="bg-gray-800/80 rounded-3xl p-8 border border-gray-700">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-white">실명 인증</h2>
                            <p className="text-gray-400 mt-2">정산 및 거래 안전을 위해 본인인증이 필요합니다</p>
                        </div>

                        {!codeSent ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">실명</label>
                                    <input
                                        type="text"
                                        value={identityForm.realName}
                                        onChange={(e) => setIdentityForm({ ...identityForm, realName: e.target.value })}
                                        placeholder="한글 또는 영문 1~10자"
                                        className={`w-full bg-gray-900/50 border ${errors.realName ? 'border-red-500' : identityForm.realName.length > 0 ? 'border-blue-500' : 'border-gray-700'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                                    />
                                    {errors.realName && <p className="text-red-500 text-xs mt-2 ml-1">한글 또는 영문으로 1~10자를 입력해주세요</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">휴대폰 번호</label>
                                    <input
                                        type="tel"
                                        value={identityForm.contactPhone}
                                        onChange={(e) => setIdentityForm({ ...identityForm, contactPhone: formatPhone(e.target.value) })}
                                        placeholder="01X-0000-0000"
                                        maxLength={13}
                                        className={`w-full bg-gray-900/50 border ${errors.contactPhone ? 'border-red-500' : identityForm.contactPhone.length > 0 ? 'border-blue-500' : 'border-gray-700'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                                    />
                                    {errors.contactPhone && <p className="text-red-500 text-xs mt-2 ml-1">유효한 휴대폰 번호 형식이 아닙니다 (01X-XXXX-XXXX)</p>}
                                </div>
                                <button
                                    onClick={handleSendCode}
                                    disabled={loading || !identityForm.realName || !identityForm.contactPhone || errors.realName || errors.contactPhone}
                                    className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold disabled:opacity-30 hover:bg-yellow-400 transition-all"
                                >
                                    {loading ? '인증 코드 생성 중...' : '인증번호 받기'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 text-center">
                                    <p className="text-blue-400 text-sm font-medium">
                                        📱 {identityForm.contactPhone} 번호로 6자리 인증번호가 발송되었습니다.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-sm font-semibold text-gray-400">인증번호</label>
                                        {countdown > 0 && <span className="text-yellow-400 text-xs font-mono">{formatTime(countdown)}</span>}
                                    </div>
                                    <input
                                        type="text"
                                        value={identityForm.verifyCode}
                                        onChange={(e) => {
                                            setIdentityForm({ ...identityForm, verifyCode: e.target.value.replace(/[^\d]/g, '').slice(0, 6) });
                                            setVerifyError('');
                                        }}
                                        placeholder="000000"
                                        maxLength={6}
                                        className={`w-full bg-gray-900 border ${verifyError ? 'border-red-500' : identityForm.verifyCode.length === 6 ? 'border-blue-500' : 'border-gray-700'} rounded-xl px-4 py-4 text-white text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:border-yellow-500 transition-all`}
                                    />
                                    {verifyError && <p className="text-red-500 text-xs mt-2 text-center">{verifyError}</p>}
                                </div>
                                <p className="text-center text-xs text-gray-500">테스트 인증번호: <span className="text-yellow-400">123456</span></p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setCodeSent(false); setVerifyError(''); }}
                                        className="flex-1 bg-gray-700 text-white py-4 rounded-xl font-bold hover:bg-gray-600 transition-all"
                                    >
                                        번호 재수정
                                    </button>
                                    <button
                                        onClick={handleVerifyIdentity}
                                        disabled={loading || identityForm.verifyCode.length !== 6}
                                        className="flex-1 bg-yellow-500 text-black py-4 rounded-xl font-bold disabled:opacity-30 hover:bg-yellow-400 transition-all"
                                    >
                                        인증 완료
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: 주소 입력 */}
                {step === 'address' && (
                    <div className="bg-gray-800/80 rounded-3xl p-8 border border-gray-700">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-white">물품 수거 주소지</h2>
                            <p className="text-gray-400 mt-2">판매 검수 물품을 방문 수거할 주소입니다</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">우편번호</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={addressForm.zipCode}
                                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value.replace(/[^\d]/g, '').slice(0, 5) })}
                                        placeholder="00000"
                                        maxLength={5}
                                        className={`w-32 bg-gray-900 border ${errors.zipCode ? 'border-red-500' : addressForm.zipCode.length > 0 ? 'border-blue-500' : 'border-gray-700'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                                    />
                                    <button className="flex-1 bg-gray-700 text-white px-6 rounded-xl font-bold hover:bg-gray-600 transition-all">
                                        우편번호 검색
                                    </button>
                                </div>
                                {errors.zipCode && <p className="text-red-500 text-xs mt-2 ml-1">우편번호는 5자리 숫자여야 합니다</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">기본 주소</label>
                                <input
                                    type="text"
                                    value={addressForm.address}
                                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                    placeholder="상세주소를 제외한 전체 주소"
                                    className={`w-full bg-gray-900 border ${errors.address ? 'border-red-500' : addressForm.address.length > 0 ? 'border-blue-500' : 'border-gray-700'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">상세 주소 (건물명, 동호수)</label>
                                <input
                                    type="text"
                                    value={addressForm.addressDetail}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressDetail: e.target.value })}
                                    placeholder="상세 정보를 입력하세요"
                                    className={`w-full bg-gray-900 border ${addressForm.addressDetail.length > 0 ? 'border-blue-500' : 'border-gray-700'} rounded-xl px-4 py-4 text-white focus:outline-none focus:border-yellow-500 transition-all`}
                                />
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    onClick={() => setStep('identity')}
                                    className="flex-1 bg-gray-700 text-white py-4 rounded-xl font-bold hover:bg-gray-600 transition-all"
                                >
                                    이전으로
                                </button>
                                <button
                                    onClick={handleSaveAddressAndComplete}
                                    disabled={loading || !addressForm.zipCode || !addressForm.address || errors.zipCode || errors.address}
                                    className="flex-1 bg-yellow-500 text-black py-4 rounded-xl font-bold disabled:opacity-30 hover:bg-yellow-400 transition-all"
                                >
                                    {loading ? '최종 등록 중...' : '판매자 등록 완료'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
