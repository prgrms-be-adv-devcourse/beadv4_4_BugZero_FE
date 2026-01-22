import createClient from "openapi-fetch";
import { paths } from "./schema";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: "include",
});

// ✅ 리프레시 요청을 관리하는 변수 (여러 API가 동시에 실패해도 하나만 실행되게 함)
let refreshPromise: Promise<any> | null = null;

client.use({
    async onRequest({ request }) {
        // 1. 리프레시 요청 자체는 인터셉터를 타지 않음 (무한 루프 방지)
        if (request.url.includes('/api/v1/auth/refresh')) return request;

        let token = useAuthStore.getState().accessToken;

        // 2. 토큰이 없으면 리프레시 시도
        if (!token) {
            try {
                // ✅ 핵심: 이미 진행 중인 리프레시가 있다면 그 결과를 기다리고, 없으면 새로 시작함
                if (!refreshPromise) {
                    refreshPromise = api.refreshAccessToken().finally(() => {
                        refreshPromise = null; // 완료 후 반드시 초기화
                    });
                }

                const tokenData = await refreshPromise;
                token = tokenData?.accessToken || null;
            } catch (error) {
                // 비로그인 사용자 혹은 만료된 경우 (Silent Refresh 실패)
                console.warn("인증 복구 실패");
            }
        }

        // 3. 토큰이 있다면 헤더에 주입
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }

        return request;
    },

    async onResponse({ response, request }) {
        // 1. 401 에러(만료) 시 처리
        if (response.status === 401 && !request.url.includes('/api/v1/auth/refresh')) {
            try {
                // ✅ 여기서도 동일하게 기존 리프레시 Promise가 있다면 재사용
                if (!refreshPromise) {
                    refreshPromise = api.refreshAccessToken().finally(() => {
                        refreshPromise = null;
                    });
                }

                const tokenData = await refreshPromise;

                if (tokenData?.accessToken) {
                    const newToken = tokenData.accessToken;

                    // 2. 실패했던 원래 요청 복제 및 재시도
                    const retryRequest = new Request(request.url, request);
                    retryRequest.headers.set("Authorization", `Bearer ${newToken}`);
                    return fetch(retryRequest);
                }
            } catch (error) {
                // 리프레시 토큰까지 만료된 경우 로그아웃 처리
                useAuthStore.getState().clearAuth();
            }
        }
        return response;
    }
});