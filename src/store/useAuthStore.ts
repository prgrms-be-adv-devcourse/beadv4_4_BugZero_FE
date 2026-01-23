import { create } from 'zustand';

// ========================================
// Auth Store - 액세스 토큰 관리
// ========================================
interface AuthState {
    accessToken: string | null;
    isLoggedIn: boolean;
    role: string | null;
    setAccessToken: (token: string | null, role?: string | null) => void;
    clearAuth: () => void;
    loadTokenFromStorage: () => { accessToken: string | null; role: string | null };
}

// localStorage 키
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_ROLE_KEY = 'userRole';

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    isLoggedIn: false,
    role: null,

    setAccessToken: (token, role) => {
        if (token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, token);
            if (role) localStorage.setItem(USER_ROLE_KEY, role);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(USER_ROLE_KEY);
        }
        set({
            accessToken: token,
            isLoggedIn: !!token,
            role: role ?? null
        });
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
        if (typeof window === 'undefined') return { accessToken: null, role: null };
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const role = localStorage.getItem(USER_ROLE_KEY);
        if (token) {
            set({ accessToken: token, isLoggedIn: true, role });
        }
        return { accessToken: token, role };
    },
}));