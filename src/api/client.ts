import createClient from "openapi-fetch";
import { paths, components } from "./schema";
import { useAuthStore } from "@/store/useAuthStore";
import { authApi } from "./auth";

export const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
    querySerializer: (params) => {
        const searchParams = new URLSearchParams();

        const addParam = (key: string, value: any) => {
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
        // 무한 루프 방지
        if (request.url.includes('/api/v1/auth/refresh')) return request;

        let token = useAuthStore.getState().accessToken;

        if (!token) {
            try {
                // authApi 내부에서 싱글톤 처리되므로 단순히 호출만 하면 됨
                const tokenData = await authApi.refreshAccessToken();
                token = tokenData?.accessToken || null;
            } catch (error) {
                // 토큰 없음 - 로그인 필요
                // console.warn("Silent refresh failed or no session");
            }
        }

        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }

        return request;
    },

    async onResponse({ response, request }) {
        // 401 만료 시 자동 재시도
        if (response.status === 401 && !request.url.includes('/api/v1/auth/refresh')) {
            try {
                // authApi 내부에서 싱글톤 처리됨.
                const tokenData = await authApi.refreshAccessToken();

                if (tokenData?.accessToken) {
                    const newToken = tokenData.accessToken;

                    // 원래 실패했던 요청 복제 및 새 토큰 주입
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