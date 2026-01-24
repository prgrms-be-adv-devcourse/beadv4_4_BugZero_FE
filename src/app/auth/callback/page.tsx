'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setRole = useAuthStore((state) => state.setRole);

    useEffect(() => {
        const token = searchParams.get('accessToken');

        if (token) {
            setAccessToken(token);
            // 토큰 설정 후 내 정보 조회하여 Role 설정
            import('@/lib/api').then(({ api }) => {
                api.getMe().then((me) => {
                    if (me && me.role) {
                        setRole(me.role);
                    }
                    router.replace('/');
                }).catch(() => {
                    // 정보 조회 실패해도 일단 이동 (AuthInitializer가 재시도할 것임)
                    router.replace('/');
                });
            });
        } else {
            toast.error('로그인에 실패했습니다.');
            router.replace('/login');
        }
    }, [searchParams, setAccessToken, setRole, router]);

    return <div className="p-10 text-center">로그인 처리 중...</div>;
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}