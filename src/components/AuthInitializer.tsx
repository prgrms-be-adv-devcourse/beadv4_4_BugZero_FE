'use client';

import { useEffect } from 'react';
import { authApi } from '@/api/auth';

export default function AuthInitializer() {
    useEffect(() => {
        const initAuth = async () => {
            try {
                // 앱 진입 시 리프레시 토큰(쿠키)을 이용해 새 액세스 토큰 발급 시도
                // authApi 내부에서 싱글톤 + useAuthStore 업데이트 처리됨
                await authApi.refreshAccessToken();
            } catch {
                // 토큰이 없거나 만료된 경우 - 로그인 안 된 상태 유지
                // console.log("세션 정보가 없거나 만료되었습니다.");
            }
        };

        initAuth();
    }, []);

    return null;
}