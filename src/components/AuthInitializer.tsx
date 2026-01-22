'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

export default function AuthInitializer() {
    useEffect(() => {
        const initAuth = async () => {
            try {
                // 앱 진입 시 리프레시 토큰(쿠키)을 이용해 새 액세스 토큰 발급 시도
                await api.refreshAccessToken();
                // authApi 내부에서 useAuthStore 업데이트가 이루어지므로 별도 setAccessToken 불필요
            } catch (error) {
                // 토큰이 없거나 만료된 경우 아무것도 하지 않음 (로그인 안 된 상태 유지)
                console.log("세션 정보가 없거나 만료되었습니다.");
            }
        };

        initAuth();
    }, []);

    return null; // UI는 렌더링하지 않음
}