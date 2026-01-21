import createClient from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://52.78.240.121:8080";

export const client = createClient<paths>({
    baseUrl: API_BASE,
});

// 기존의 createAuthHeaders 역할을 하는 미들웨어
client.use({
    onRequest({ request }) {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) {
                request.headers.set("Authorization", `Bearer ${token}`);
            }
        }
        return request;
    },
});