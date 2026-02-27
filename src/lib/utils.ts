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

/**
 * 날짜 객체나 문자열을 받아 브라우저 로컬 타임존과 관계없이 무조건 KST(한국 표준시) 기준으로 텍스트를 포맷팅합니다.
 */
export function formatKSTDate(dateInput?: string | Date, format: "MM/DD HH:mm" | "YYYY-MM-DD HH:mm" | "YYYY. MM. DD. HH:mm:ss" | "MM.DD HH:mm" = "MM/DD HH:mm"): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? parseDate(dateInput) : dateInput;

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    const YYYY = getPart('year');
    const MM = getPart('month');
    const DD = getPart('day');
    const hh = getPart('hour') === '24' ? '00' : getPart('hour');
    const mm = getPart('minute');
    const ss = getPart('second');

    if (format === "MM/DD HH:mm") return `${MM}/${DD} ${hh}:${mm}`;
    if (format === "MM.DD HH:mm") return `${MM}.${DD} ${hh}:${mm}`;
    if (format === "YYYY-MM-DD HH:mm") return `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
    if (format === "YYYY. MM. DD. HH:mm:ss") return `${YYYY}. ${MM}. ${DD}. ${hh}:${mm}:${ss}`;

    return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}
