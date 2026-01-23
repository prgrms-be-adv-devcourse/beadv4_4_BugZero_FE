'use client';

import { useEffect } from 'react';
import { authApi } from '@/api/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthInitializer() {
    const loadTokenFromStorage = useAuthStore((state) => state.loadTokenFromStorage);

    useEffect(() => {
        const initAuth = async () => {
            // 1단계: localStorage에서 기존 토큰 복원 시도
            const existingToken = loadTokenFromStorage();

            if (existingToken.accessToken) {
                // 토큰이 있으면 내 정보 조회를 통해 role 가져오기
                try {
                    const me = await api.getMe();
                    useAuthStore.getState().setAccessToken(existingToken.accessToken, me.role);
                } catch (error) {
                    console.error("Failed to fetch user info:", error);
                }
                return;
            }

            // 2단계: 토큰 없을 때만 refresh 시도
            try {
                await authApi.refreshAccessToken();
                // refresh 성공 후에도 role을 동기화하기 위해 getMe 호출
                const me = await api.getMe();
                const newToken = useAuthStore.getState().accessToken;
                useAuthStore.getState().setAccessToken(newToken, me.role);
            } catch {
                // 세션 없음 - 로그인 필요
            }
        };

        initAuth();
    }, [loadTokenFromStorage]);

    return null;
}