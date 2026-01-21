import createClient from "openapi-fetch";
import { useAuthStore } from "@/store/useAuthStore";

export const client = createClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
});

client.use({
    onRequest({ request }) {
        // Zustand 스토어에서 최신 토큰 참조
        const token = useAuthStore.getState().accessToken;
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
        return request;
    },
});