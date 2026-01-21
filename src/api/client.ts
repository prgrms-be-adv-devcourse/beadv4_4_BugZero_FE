import createClient from "openapi-fetch";
import { useAuthStore } from "@/store/useAuthStore";
import { paths } from "./schema";

export const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
});

client.use({
    onRequest({ request }) {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
        return request;
    },
});