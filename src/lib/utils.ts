
export function sanitizeImageUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;

    // 이미 완전한 URL인 경우 그대로 반환
    if (url.startsWith("http")) return url;

    // S3 Base URL이 설정되어 있다면 결합
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL;
    if (s3BaseUrl) {
        // S3 path는 보통 "products/..." 형태로 저장되므로 / 처리를 유연하게
        const cleanBase = s3BaseUrl.endsWith('/') ? s3BaseUrl.slice(0, -1) : s3BaseUrl;
        const cleanPath = url.startsWith('/') ? url.slice(1) : url;
        return `${cleanBase}/${cleanPath}`;
    }

    // S3 URL이 없고 상대 경로인 경우 API URL을 prefix로 사용 (이전 로직 호환)
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://52.78.240.121:8080';
    const cleanPath = url.startsWith('/') ? url : `/${url}`;

    return `${apiBaseUrl}${cleanPath}`;
}
