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
        // 1. 무한 루프 방지: 리프레시 요청은 인터셉터를 타지 않음
        if (request.url.includes('/api/v1/auth/refresh')) return request;

        let token = useAuthStore.getState().accessToken;

        // 2. 메모리에 토큰이 없는데, 리프레시 시도를 이미 실패한 적이 없다면 복구 시도
        // (팁: sessionStorage 등에 리프레시 실패 기록을 남겨 비로그인 유저의 반복 요청을 막을 수 있음)
        if (!token) {
            try {
                const tokenData = await api.refreshAccessToken();
                if (tokenData && tokenData.accessToken) {
                    token = tokenData.accessToken;
                    useAuthStore.getState().setAccessToken(token);
                }
            } catch (error) {
                // 비로그인 사용자이거나 세션 만료인 경우 (정상적인 상황)
            }
        }

        // 3. 토큰이 확보되었다면 헤더에 주입
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }

        return request;
    },

    async onResponse({ response, request }) {
        // 1. 401(만료) 에러 처리 (로그인 상태였으나 토큰이 수명이 다한 경우)
        if (response.status === 401 && !request.url.includes('/api/v1/auth/refresh')) {
            try {
                const tokenData = await api.refreshAccessToken();

                if (tokenData && tokenData.accessToken) {
                    const newToken = tokenData.accessToken;
                    useAuthStore.getState().setAccessToken(newToken);

                    // 2. 실패했던 원래 요청 복제 및 재시도
                    const retryRequest = new Request(request.url, request);
                    retryRequest.headers.set("Authorization", `Bearer ${newToken}`);
                    return fetch(retryRequest);
                }
            } catch (error) {
                // 리프레시 실패 시(쿠키 만료 등) 세션 초기화
                useAuthStore.getState().clearAuth();
            }
        }
        return response;
    }
});