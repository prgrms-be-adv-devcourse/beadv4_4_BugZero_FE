import createClient from "openapi-fetch";
import { paths } from "./schema";
import { useAuthStore } from "@/store/useAuthStore";
import { authApi } from "./auth";

export const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
    querySerializer: (params) => {
        const searchParams = new URLSearchParams();

        const addParam = (key: string, value: unknown) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, String(v)));
            } else {
                searchParams.append(key, String(value));
            }
        };

        for (const [key, value] of Object.entries(params)) {
            // condition과 pageable 객체는 펼쳐서 파라미터로 추가 (Spring Backend 호환)
            if (key === 'condition' || key === 'pageable') {
                if (value && typeof value === 'object') {
                    Object.entries(value).forEach(([k, v]) => addParam(k, v));
                }
            } else {
                addParam(key, value);
            }
        }

        return searchParams.toString();
    }
});

client.use({
    async onRequest({ request }) {
        // refresh 요청은 인터셉터 스킵 (무한 루프 방지)
        if (request.url.includes('/api/v1/auth/refresh')) return request;

        let token = useAuthStore.getState().accessToken;

        // 토큰 없으면 refresh 시도 (authApi 싱글톤이 중복 호출 방지)
        if (!token) {
            try {
                const tokenData = await authApi.refreshAccessToken();
                token = tokenData?.accessToken || null;
            } catch {
                // 세션 없음 - 로그인 필요
            }
        }

        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }

        return request;
    },

    async onResponse({ response, request }) {
        // 401 에러 시 재시도
        if (response.status === 401 && !request.url.includes('/api/v1/auth/refresh')) {
            try {
                // authApi 내부에서 싱글톤 처리됨
                const tokenData = await authApi.refreshAccessToken();

                if (tokenData?.accessToken) {
                    // 원래 실패했던 요청 복제 및 새 토큰 주입
                    const retryRequest = new Request(request.url, request);
                    retryRequest.headers.set("Authorization", `Bearer ${tokenData.accessToken}`);
                    return fetch(retryRequest);
                }
            } catch {
                // 리프레시 실패 → 로그아웃
                useAuthStore.getState().clearAuth();
            }
        }
        return response;
    }
});