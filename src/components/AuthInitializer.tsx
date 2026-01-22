'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthInitializer() {
    const setAccessToken = useAuthStore((state) => state.setAccessToken);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // 앱 진입 시 리프레시 토큰(쿠키)을 이용해 새 액세스 토큰 발급 시도
                const data = await api.refreshAccessToken();

                // 데이터 구조가 { accessToken: "..." } 인지 확인 필요
                if (data && data.accessToken) {
                    setAccessToken(data.accessToken);
                }
            } catch (error) {
                // 토큰이 없거나 만료된 경우 아무것도 하지 않음 (로그인 안 된 상태 유지)
                console.log("세션 정보가 없거나 만료되었습니다.");
            }
        };

        initAuth();
    }, [setAccessToken]);

    return null; // UI는 렌더링하지 않음
}