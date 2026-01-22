import createClient from "openapi-fetch";
import { paths, components } from "./schema"; // schema 경로를 프로젝트에 맞게 수정하세요
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
});

// 1. 리프레시 응답의 정확한 데이터 타입 추출 (SuccessResponseDtoMapStringString['data'])
type RefreshResponseData = components["schemas"]["SuccessResponseDtoMapStringString"]["data"];

// 2. Promise에 구체적인 타입 적용 (any 제거)
let refreshPromise: Promise<RefreshResponseData | undefined> | null = null;

client.use({
    async onRequest({ request }) {
        // 무한 루프 방지
        if (request.url.includes('/api/v1/auth/refresh')) return request;

        let token = useAuthStore.getState().accessToken;

        if (!token) {
            try {
                // ✅ 싱글톤 Promise 패턴 적용
                if (!refreshPromise) {
                    refreshPromise = api.refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }

                const tokenData = await refreshPromise;
                token = tokenData?.accessToken || null;
            } catch (error) {
                console.warn("Silent refresh failed or no session");
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
                if (!refreshPromise) {
                    refreshPromise = api.refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }

                const tokenData = await refreshPromise;

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