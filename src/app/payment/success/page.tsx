'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/api/utils';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // 1. URL 쿼리 파라미터에서 결제 정보 추출
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = Number(searchParams.get('amount'));

        if (!paymentKey || !orderId || !amount) return;

        const confirm = async () => {
            try {
                await api.confirmPayment({
                    paymentKey,
                    orderId,
                    amount,
                });

                alert('예치금 충전이 완료되었습니다! 마이페이지로 이동합니다.');
                router.replace('/mypage');
            } catch (error: unknown) {
                const errorMessage = getErrorMessage(error, "결제 승인 중 알 수 없는 오류가 발생했습니다.");

                console.error('[PaymentSuccess] Confirm Error:', errorMessage);
                alert(errorMessage);

                router.replace('/payment/fail');
            }
        };

        confirm();
    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            {/* RareGo 테마에 맞춘 로딩 UI */}
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-bold tracking-tight">
                결제를 안전하게 처리하고 있습니다...
            </p>
            <p className="text-gray-500 text-sm">잠시만 기다려 주세요.</p>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        // useSearchParams를 사용하므로 Suspense로 감싸야 빌드 에러가 나지 않습니다.
        <Suspense fallback={<div className="text-white p-20 text-center">로딩 중...</div>}>
            <SuccessContent />
        </Suspense>
    );
}