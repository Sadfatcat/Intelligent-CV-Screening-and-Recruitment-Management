// Recruiter Formatters: format ngày giờ và điểm hiển thị trên UI.
import { normalizeScore } from "./cvScoringUtils";

export function formatLogTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatScore(value: number | null | undefined) {
    const score = normalizeScore(value);
    if (score === null) return "-";
    return score.toFixed(1);
}
