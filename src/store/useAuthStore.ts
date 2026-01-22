import { create } from 'zustand';

interface AuthState {
    accessToken: string | null;
    isLoggedIn: boolean;
    setAccessToken: (token: string | null) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    isLoggedIn: false,

    setAccessToken: (token) => set({
        accessToken: token,
        isLoggedIn: !!token
    }),

    clearAuth: () => set({
        accessToken: null,
        isLoggedIn: false
    }),
}));