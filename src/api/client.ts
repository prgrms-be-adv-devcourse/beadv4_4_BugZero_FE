// src/api/client.ts (또는 api.ts)
import createClient from "openapi-fetch";
import { paths } from "./schema";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
});

client.use({
    async onRequest({ request }) {
        if (request.url.includes('/api/v1/auth/refresh')) return request;

        let token = useAuthStore.getState().accessToken;

        if (!token) {
            try {
                // ✅ 내부에서 setAccessToken을 수행하므로 반환값만 챙기면 됩니다.
                const tokenData = await api.refreshAccessToken();
                token = tokenData?.accessToken || null;
            } catch (error) {
                // 비로그인 사용자 처리
            }
        }

        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }

        return request;
    },

    async onResponse({ response, request }) {
        if (response.status === 401 && !request.url.includes('/api/v1/auth/refresh')) {
            try {
                // ✅ 1. 토큰 갱신 (내부에서 Zustand 업데이트 완료)
                const tokenData = await api.refreshAccessToken();

                if (tokenData?.accessToken) {
                    const newToken = tokenData.accessToken;

                    // ✅ 2. 실패했던 원래 요청 재시도
                    const retryRequest = new Request(request.url, request);
                    retryRequest.headers.set("Authorization", `Bearer ${newToken}`);
                    return fetch(retryRequest);
                }
            } catch (error) {
                useAuthStore.getState().clearAuth();
            }
        }
        return response;
    }
});