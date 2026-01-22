'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function FailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // 토스결제에서 에러가 나면 code와 message를 쿼리 파라미터로 던져줍니다.
    const errorCode = searchParams.get('code');
    const errorMessage = searchParams.get('message') || '결제 중 알 수 없는 오류가 발생했습니다.';

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            {/* 실패 아이콘 (X 표시) */}
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/50 rounded-full flex items-center justify-center mb-6">
                <span className="text-red-500 text-3xl font-bold">!</span>
            </div>

            <h1 className="text-white text-2xl font-bold mb-2">결제에 실패했습니다</h1>
            <p className="text-gray-400 mb-8 max-w-xs">
                {errorMessage}
                {errorCode && <span className="block text-xs mt-2 text-gray-600">에러 코드: {errorCode}</span>}
            </p>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <button
                    onClick={() => router.replace('/payment')}
                    className="w-full bg-yellow-400 text-black font-bold py-4 rounded-lg hover:bg-yellow-300 transition"
                >
                    다시 시도하기
                </button>
                <Link
                    href="/"
                    className="w-full bg-[#1a1a1a] text-white font-bold py-4 rounded-lg hover:bg-[#262626] transition border border-[#262626]"
                >
                    홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div className="text-white p-20 text-center">로딩 중...</div>}>
            <FailContent />
        </Suspense>
    );
}