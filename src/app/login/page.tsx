'use client';

import { useState } from 'react';
import Link from 'next/link';

// BE OAuth2 엔드포인트
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://52.78.240.121:8080';

export default function LoginPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
        setLoading(provider);
        // BE OAuth2 엔드포인트로 리다이렉트
        window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-3">
                        <span className="text-5xl">🧱</span>
                        <span className="text-2xl font-bold">RareGo</span>
                    </Link>
                    <p className="text-gray-400 text-sm mt-2">희귀 레고 경매 플랫폼</p>
                </div>

                {/* Login Card */}
                <div className="card p-6">
                    <h1 className="text-xl font-semibold text-center mb-2">로그인 / 회원가입</h1>
                    <p className="text-gray-500 text-sm text-center mb-6">
                        소셜 계정으로 간편하게 시작하세요
                    </p>

                    <div className="space-y-3">
                        {/* Kakao */}
                        <button
                            onClick={() => handleSocialLogin('kakao')}
                            disabled={loading !== null}
                            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] py-3.5 px-4 rounded-lg font-medium hover:bg-[#FADA0A] transition disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#191919" d="M12 3c5.8 0 10.5 3.66 10.5 8.18 0 4.52-4.7 8.18-10.5 8.18-.85 0-1.68-.08-2.47-.23l-4.22 2.82c-.28.19-.66-.06-.56-.37l.95-3.34C3.54 16.55 1.5 14.06 1.5 11.18 1.5 6.66 6.2 3 12 3z" />
                            </svg>
                            {loading === 'kakao' ? '로그인 중...' : '카카오로 시작하기'}
                        </button>

                        {/* Google */}
                        <button
                            onClick={() => handleSocialLogin('google')}
                            disabled={loading !== null}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3.5 px-4 rounded-lg font-medium hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {loading === 'google' ? '로그인 중...' : 'Google로 시작하기'}
                        </button>

                        {/* Naver */}
                        <button
                            onClick={() => handleSocialLogin('naver')}
                            disabled={loading !== null}
                            className="w-full flex items-center justify-center gap-3 bg-[#03C75A] text-white py-3.5 px-4 rounded-lg font-medium hover:bg-[#02B351] transition disabled:opacity-50"
                        >
                            <span className="font-bold text-lg">N</span>
                            {loading === 'naver' ? '로그인 중...' : '네이버로 시작하기'}
                        </button>
                    </div>
                </div>

                {/* 안내 문구 */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-xs">
                        처음 로그인하시면 자동으로 회원가입됩니다.
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                        로그인 시 <a href="#" className="text-yellow-400 hover:underline">이용약관</a> 및{' '}
                        <a href="#" className="text-yellow-400 hover:underline">개인정보처리방침</a>에 동의합니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
