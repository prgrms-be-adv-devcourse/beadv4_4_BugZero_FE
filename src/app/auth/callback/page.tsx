'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAccessToken = useAuthStore((state) => state.setAccessToken);

    useEffect(() => {
        const token = searchParams.get('accessToken');

        if (token) {
            setAccessToken(token);
            router.replace('/'); // replace를 써서 뒤로가기 방지
        } else {
            alert('로그인에 실패했습니다.');
            router.replace('/login');
        }
    }, [searchParams, setAccessToken, router]);

    return <div className="p-10 text-center">로그인 처리 중...</div>;
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}