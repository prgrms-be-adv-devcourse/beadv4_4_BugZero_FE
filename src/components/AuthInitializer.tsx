'use client';

import { useEffect } from 'react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthInitializer() {
    const loadTokenFromStorage = useAuthStore((state) => state.loadTokenFromStorage);

    useEffect(() => {
        const initAuth = async () => {
            // 1단계: localStorage에서 기존 토큰 복원 시도
            const existingToken = loadTokenFromStorage();

            if (existingToken) {
                // 토큰이 있으면 그냥 사용 - refresh 불필요!
                return;
            }

            // 2단계: 토큰 없을 때만 refresh 시도
            try {
                await authApi.refreshAccessToken();
            } catch {
                // 세션 없음 - 로그인 필요
            }
        };

        initAuth();
    }, [loadTokenFromStorage]);

    return null;
}