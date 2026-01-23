'use client';

import { useEffect, useRef } from 'react';
import { authApi } from '@/api/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthInitializer() {
    const loadTokenFromStorage = useAuthStore((state) => state.loadTokenFromStorage);
    const setRole = useAuthStore((state) => state.setRole);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        const initAuth = async () => {
            // 1단계: localStorage에서 기존 토큰 복원 시도
            const existingToken = loadTokenFromStorage();
            let token = existingToken;

            if (existingToken) {
                // 토큰이 있으면 그냥 사용 - refresh 불필요!
                return;
            }

            // 2단계: 토큰 없을 때만 refresh 시도 (실패 시 무시)
            if (!token) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const res: any = await authApi.refreshAccessToken();
                    if (typeof res === 'string') token = res;
                    else if (res?.accessToken) token = res.accessToken;
                } catch {
                    // 세션 없음 - 로그인 필요
                }
            }

            // 3단계: 토큰이 있다면 내 정보(Role) 조회
            if (token) {
                try {
                    const me = await api.getMe();
                    setRole(me.role || 'USER');
                } catch (e) {
                    console.error('Failed to load user info', e);
                }
            }
        };

        initAuth();
    }, [loadTokenFromStorage]);

    return null;
}