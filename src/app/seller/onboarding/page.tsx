'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { authApi } from '@/api/auth';
import { useMemberStore } from '@/store/useMemberStore';

type OnboardingStep = 'intro' | 'identity' | 'address' | 'complete';

export default function SellerOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>('intro');
    const [loading, setLoading] = useState(false);
    const { isLoaded: memberLoaded, fetchMemberInfo } = useMemberStore();

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
        const info = await fetchMemberInfo();
        if (!info) {
            router.push('/login');
            return;
        }
        // 이미 판매자인 경우 바로 상품 등록 페이지로 이동
        if (info.role === 'SELLER') {
            const hasIdentity = !!(info.realNameMasked && info.contactPhoneMasked);
            const hasAddress = !!(info.address && info.zipCode);
            if (hasIdentity && hasAddress) {
                router.replace('/products/register');
            }
        }
    }, [router, fetchMemberInfo]);

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
            await fetchMemberInfo(true);
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

            // 4. 전역 상태 갱신
            await fetchMemberInfo(true);

            // 5. 완료 후 바로 상품 등록으로 이동 (강제 새로고침)
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
        { key: 'intro', label: '판매자 정책' },
        { key: 'identity', label: '본인 인증' },
        { key: 'address', label: '배송지 입력' },
        { key: 'complete', label: '등록 완료' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    if (!memberLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-card">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-yellow-400 transition-all font-medium mb-10 group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> 홈으로 돌아가기
                </Link>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-16 relative px-4">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-card -z-10" />
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-yellow-500 transition-all duration-700 ease-out -z-10"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((s, i) => (
                        <div key={s.key} className="flex flex-col items-center gap-3">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-4 ${currentStepIndex > i
                                ? 'bg-green-500 border-green-500/20 text-foreground'
                                : currentStepIndex === i
                                    ? 'bg-yellow-500 border-yellow-500/20 text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                                    : 'bg-card border-[#070707] text-gray-600'
                                }`}>
                                {currentStepIndex > i ? '✓' : i + 1}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStepIndex >= i ? 'text-foreground' : 'text-gray-600'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: 정책 안내 */}
                {step === 'intro' && (
                    <div>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-extrabold text-foreground mb-3">RareGo 판매자 정책</h1>
                            <p className="text-muted">투명하고 공정한 경매 문화를 함께 만들어가요</p>
                        </div>

                        <div className="grid gap-4 mb-10">
                            <div className="bg-card/50 rounded-3xl p-8 border border-border hover:border-yellow-500/30 transition-all duration-300 group">
                                <div className="flex gap-6">
                                    <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl group-hover:scale-110 transition-transform">💰</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">합리적인 10% 수수료</h3>
                                        <p className="text-muted text-sm leading-relaxed">
                                            정식 판매 낙찰 시에만 <span className="text-yellow-400 font-bold underline underline-offset-4">낙찰가의 10%</span>가 수수료로 발생합니다.
                                            경매가 유찰될 경우 판매자가 부담하는 비용은 <span className="text-foreground font-bold">0원</span>입니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card/50 rounded-3xl p-8 border border-border hover:border-blue-500/30 transition-all duration-300 group">
                                <div className="flex gap-6">
                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl group-hover:scale-110 transition-transform">🛡️</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">판매자 보호 (보증금 보상)</h3>
                                        <p className="text-muted text-sm leading-relaxed">
                                            낙찰자가 정당한 사유 없이 결제를 거부할 경우, 낙찰자가 예치한 <span className="text-blue-400 font-bold underline underline-offset-4">보증금 전액</span>을 판매자에게 보상금으로 지급합니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card/50 rounded-3xl p-8 border border-border hover:border-green-500/30 transition-all duration-300 group">
                                <div className="flex gap-6">
                                    <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl group-hover:scale-110 transition-transform">🤝</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">검수 기반 직거래</h3>
                                        <p className="text-muted text-sm leading-relaxed">
                                            본사 정밀 검수를 통과한 상품만 경매가 진행됩니다.
                                            검수 완료 후 시스템에서 경매가 자동 시작되어 편리합니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const info = useMemberStore.getState().memberInfo;
                                if (api.isVerified(info)) {
                                    setStep('address');
                                } else {
                                    setStep('identity');
                                }
                            }}
                            className="w-full bg-yellow-500 text-black py-6 rounded-3xl font-black text-xl hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all active:scale-[0.98]"
                        >
                            정책 동의 및 판매 시작하기
                        </button>
                    </div>
                )}

                {/* Step 2: 본인인증 */}
                {step === 'identity' && (
                    <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-border shadow-2xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-foreground mb-3">실명 인증</h2>
                            <p className="text-muted">정산 및 거래 안전을 위해 본인인증이 필요합니다</p>
                        </div>

                        {!codeSent ? (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-muted uppercase tracking-widest ml-1">실명</label>
                                    <input
                                        type="text"
                                        value={identityForm.realName}
                                        onChange={(e) => setIdentityForm({ ...identityForm, realName: e.target.value })}
                                        placeholder="이름을 입력하세요"
                                        className={`w-full bg-background border-2 ${errors.realName ? 'border-red-500/50' : identityForm.realName.length > 0 ? 'border-yellow-500/30' : 'border-border'} rounded-2xl px-6 py-5 text-foreground focus:outline-none focus:border-yellow-500 transition-all font-medium`}
                                    />
                                    {errors.realName && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">한글 또는 영문으로 1~10자를 입력해주세요</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-muted uppercase tracking-widest ml-1">휴대폰 번호</label>
                                    <input
                                        type="tel"
                                        value={identityForm.contactPhone}
                                        onChange={(e) => setIdentityForm({ ...identityForm, contactPhone: formatPhone(e.target.value) })}
                                        placeholder="010-0000-0000"
                                        maxLength={13}
                                        className={`w-full bg-background border-2 ${errors.contactPhone ? 'border-red-500/50' : identityForm.contactPhone.length > 0 ? 'border-yellow-500/30' : 'border-border'} rounded-2xl px-6 py-5 text-foreground focus:outline-none focus:border-yellow-500 transition-all font-medium`}
                                    />
                                    {errors.contactPhone && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">유효한 휴대폰 번호 형식이 아닙니다</p>}
                                </div>
                                <button
                                    onClick={handleSendCode}
                                    disabled={loading || !identityForm.realName || !identityForm.contactPhone || errors.realName || errors.contactPhone}
                                    className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black text-lg disabled:opacity-30 hover:bg-yellow-400 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {loading ? '인증 코드 생성 중...' : '인증번호 받기'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center">
                                    <p className="text-yellow-500 text-sm font-bold">
                                        📱 {identityForm.contactPhone} 번호로<br />인증번호 6자리가 발송되었습니다.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-bold text-muted uppercase tracking-widest">인증번호</label>
                                        {countdown > 0 && <span className="text-red-500 text-sm font-mono font-bold bg-red-500/10 px-2 py-1 rounded-lg">{formatTime(countdown)}</span>}
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
                                        className={`w-full bg-background border-2 ${verifyError ? 'border-red-500/50' : identityForm.verifyCode.length === 6 ? 'border-yellow-500/30' : 'border-border'} rounded-2xl px-6 py-6 text-foreground text-center text-4xl font-black tracking-[0.3em] focus:outline-none focus:border-yellow-500 transition-all`}
                                    />
                                    {verifyError && <p className="text-red-500 text-xs mt-2 text-center font-bold">{verifyError}</p>}
                                    <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-wider">테스트 인증번호: <span className="text-yellow-500/50">123456</span></p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setCodeSent(false); setVerifyError(''); }}
                                        className="flex-1 bg-card text-muted py-5 rounded-2xl font-bold hover:bg-muted transition-all"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleVerifyIdentity}
                                        disabled={loading || identityForm.verifyCode.length !== 6}
                                        className="flex-2 bg-yellow-500 text-black py-5 rounded-2xl font-black text-lg disabled:opacity-30 hover:bg-yellow-400 transition-all shadow-lg active:scale-[0.98]"
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
                    <div className="bg-card/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-border shadow-2xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-foreground mb-3">물품 수거 주소지</h2>
                            <p className="text-muted">판매 검수 물품을 방문 수거할 주소입니다</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest ml-1">우편번호</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={addressForm.zipCode}
                                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value.replace(/[^\d]/g, '').slice(0, 5) })}
                                        placeholder="00000"
                                        maxLength={5}
                                        className={`w-36 bg-background border-2 ${errors.zipCode ? 'border-red-500/50' : addressForm.zipCode.length > 0 ? 'border-yellow-500/30' : 'border-border'} rounded-2xl px-6 py-5 text-foreground focus:outline-none focus:border-yellow-500 transition-all font-medium`}
                                    />
                                    <button className="flex-1 bg-card text-foreground px-8 rounded-2xl font-bold hover:bg-muted transition-all border border-[#222222]">
                                        주소 검색
                                    </button>
                                </div>
                                {errors.zipCode && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">우편번호는 5자리 숫자여야 합니다</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest ml-1">기본 주소</label>
                                <input
                                    type="text"
                                    value={addressForm.address}
                                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                    placeholder="주소를 입력하세요"
                                    className={`w-full bg-background border-2 ${errors.address ? 'border-red-500/50' : addressForm.address.length > 0 ? 'border-yellow-500/30' : 'border-border'} rounded-2xl px-6 py-5 text-foreground focus:outline-none focus:border-yellow-500 transition-all font-medium`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest ml-1">상세 주소</label>
                                <input
                                    type="text"
                                    value={addressForm.addressDetail}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressDetail: e.target.value })}
                                    placeholder="상세 정보를 입력하세요"
                                    className={`w-full bg-background border-2 ${addressForm.addressDetail.length > 0 ? 'border-yellow-500/30' : 'border-border'} rounded-2xl px-6 py-5 text-foreground focus:outline-none focus:border-yellow-500 transition-all font-medium`}
                                />
                            </div>

                            <div className="flex gap-4 pt-10">
                                <button
                                    onClick={() => {
                                        const info = useMemberStore.getState().memberInfo;
                                        if (api.isVerified(info)) {
                                            setStep('intro');
                                        } else {
                                            setStep('identity');
                                        }
                                    }}
                                    className="flex-1 bg-card text-muted py-5 rounded-2xl font-bold hover:bg-muted transition-all"
                                >
                                    이전으로
                                </button>
                                <button
                                    onClick={handleSaveAddressAndComplete}
                                    disabled={loading || !addressForm.zipCode || !addressForm.address || errors.zipCode || errors.address}
                                    className="flex-2 bg-yellow-500 text-black py-5 rounded-2xl font-black text-lg disabled:opacity-30 hover:bg-yellow-400 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {loading ? '등록 처리 중...' : '판매자 등록 완료'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
