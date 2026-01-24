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

            // 2단계: 토큰 없을 때만 refresh 시도
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
            // 토큰이 스토리지에 있었더라도 Role이 없을 수 있으므로 항상 확인 (또는 스토어의 role 확인)
            if (token) {
                try {
                    const me = await api.getMe();
                    if (me && me.role) {
                        setRole(me.role);
                    }
                } catch (e) {
                    console.error('Failed to load user info', e);
                }
            }
        };

        initAuth();
    }, [loadTokenFromStorage, setRole]);

    return null;
}