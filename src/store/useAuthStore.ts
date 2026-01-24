import { create } from 'zustand';

// ========================================
// Auth Store - 액세스 토큰 관리
// ========================================
interface AuthState {
    accessToken: string | null;
    isLoggedIn: boolean;
    role: string | null;
    setAccessToken: (token: string | null) => void;
    setRole: (role: string) => void;
    clearAuth: () => void;
    loadTokenFromStorage: () => string | null; // localStorage에서 토큰 복원
}

// localStorage 키
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_ROLE_KEY = 'userRole';

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    isLoggedIn: false,
    role: null,

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

    setRole: (role) => {
        if (role) {
            localStorage.setItem(USER_ROLE_KEY, role);
        } else {
            localStorage.removeItem(USER_ROLE_KEY);
        }
        set({ role });
    },

    clearAuth: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        set({
            accessToken: null,
            isLoggedIn: false,
            role: null
        });
    },

    loadTokenFromStorage: () => {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const role = localStorage.getItem(USER_ROLE_KEY);

        if (token) {
            set({
                accessToken: token,
                isLoggedIn: true,
                role: role
            });
        }
        return token;
    },
}));