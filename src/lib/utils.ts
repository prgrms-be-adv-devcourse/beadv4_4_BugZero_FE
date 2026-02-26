/**
 * Safely parses a backend date string into a Date object.
 * 백엔드에서 타임존 정보가 없는 LocalDateTime 형태의 문자열을 보내줄 때,
 * 이를 무조건 한국 표준시(KST) 기준으로 해석하도록 강제합니다.
 */
export function parseDate(dateString?: string): Date {
    if (!dateString) return new Date();

    // 이미 타임존 정보('Z', '+', '-')가 포함되어 있다면 그대로 사용하고,
    // 포함되어 있지 않다면 강제로 KST 타임존 (+09:00)을 명시합니다.
    const hasTimezone = dateString.endsWith('Z') || dateString.includes('+') || dateString.match(/-\d{2}:\d{2}$/);

    const dateStr = hasTimezone ? dateString : `${dateString}+09:00`;
    return new Date(dateStr);
}
