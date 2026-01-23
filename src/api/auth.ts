import { useAuthStore } from "@/store/useAuthStore";
import { components } from "@/api/schema";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://52.78.240.121:8080';

// 싱글톤 Promise 변수: 동시에 여러 리프레시 요청이 와도 하나만 실행
type RefreshResponseData = components["schemas"]["SuccessResponseDtoMapStringString"]["data"];
let refreshPromise: Promise<RefreshResponseData | undefined> | null = null;

export const authApi = {
    // 엑세스 토큰 재발급 (Raw Fetch 사용 - Interceptor 순환 참조 방지)
    refreshAccessToken: async () => {
        // 이미 진행 중인 리프레시 요청이 있다면 그걸 반환 (중복 요청 방지)
        if (refreshPromise) {
            return refreshPromise;
        }

        // 새로운 리프레시 요청 시작 및 Promise 저장
        refreshPromise = (async () => {
            try {
                // const refreshToken = getRefreshTokenFromCookie(); // 쿠키에서 가져오거나, 필요 시 로직 추가

                // openapi-fetch client가 아닌 raw fetch 사용
                const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // 쿠키 전송
                });

                if (!response.ok) {
                    // 401: Refresh Token 만료 -> 로그아웃 처리
                    throw new Error("Refresh failed");
                }

                const json = await response.json();

                // SuccessResponseDto 구조 파싱 ( { data: { accessToken: "..." }, ... } )
                const tokenData = json.data;

                if (tokenData && tokenData.accessToken) {
                    useAuthStore.getState().setAccessToken(tokenData.accessToken);
                    return tokenData;
                }

                throw new Error("No access token in response");

            } catch (error) {
                console.warn("Token refresh failed:", error);
                useAuthStore.getState().clearAuth(); // 세션 만료 시 client 로그아웃
                throw error;
            } finally {
                // 요청 완료 후 Promise 초기화 (다음 요청을 위해)
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    }
};
