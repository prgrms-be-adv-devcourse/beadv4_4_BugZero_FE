// 백엔드 공통 에러 응답 구조와 일치시킵니다.
interface ErrorResponse {
    message?: string;
    status?: number;
    code?: number;
}

/**
 * 에러 객체가 우리가 정의한 ErrorResponse 구조인지 확인하는 타입 가드
 */
function isErrorResponse(error: unknown): error is ErrorResponse {
    return (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as ErrorResponse).message === "string"
    );
}

/**
 * 발생한 에러에서 안전하게 메시지를 추출하는 함수
 * @param error - catch문이나 api 응답에서 받은 에러 객체
 * @param defaultMsg - 메시지가 없을 경우 사용할 기본 메시지
 */
export const getErrorMessage = (error: unknown, defaultMsg: string): string => {
    if (isErrorResponse(error)) {
        return error.message || defaultMsg;
    }

    // 만약 error 자체가 표준 Error 객체인 경우
    if (error instanceof Error) {
        return error.message;
    }

    return defaultMsg;
};