import { create } from 'zustand';

// ========================================
// Auth Store - 액세스 토큰 관리
// ========================================
interface AuthState {
    accessToken: string | null;
    isLoggedIn: boolean;
    setAccessToken: (token: string | null) => void;
    clearAuth: () => void;
    loadTokenFromStorage: () => string | null; // localStorage에서 토큰 복원
}

// localStorage 키
const ACCESS_TOKEN_KEY = 'accessToken';

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    isLoggedIn: false,

    setAccessToken: (token) => {
        // localStorage에도 저장 (페이지 새로고침 시 복원용)
        if (token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
        set({
            accessToken: token,
            isLoggedIn: !!token
        });
    },

    clearAuth: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        set({
            accessToken: null,
            isLoggedIn: false
        });
    },

    loadTokenFromStorage: () => {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
            set({ accessToken: token, isLoggedIn: true });
        }
        return token;
    },
}));