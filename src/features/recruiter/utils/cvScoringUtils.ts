// Score Utils: xử lý điểm, trạng thái, filter và sort CV.
import { JOB_MANAGEMENT_LABELS, SCORE_STATUS_LABELS } from "../constants/recruiterConstants";
import type { CVLogItem, CvSortMode, ExperienceFilter, JobManagementStatus, MatchingDetail, ScoreStatus, ScreeningSummary } from "../types/recruiterTypes";

export function getRenderableMatchingSections(detail: MatchingDetail | null | undefined) {
    return (detail?.sections || []).filter((section) => {
        return (
            typeof section.score === "number" ||
            Boolean(section.explanation?.trim()) ||
            Boolean(section.good?.length) ||
            Boolean(section.missing?.length)
        );
    });
}

export function normalizeScore(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    return Math.min(100, Math.max(0, value));
}

export const PASSED_SCORE_THRESHOLD = 75;
export const BORDERLINE_SCORE_THRESHOLD = 60;
export const WEAK_MATCH_SCORE_THRESHOLD = 45;

export function getScoreStatus(value: number | null | undefined): ScoreStatus {
    const score = normalizeScore(value);
    if (score === null) return "not_scored";
    if (score >= PASSED_SCORE_THRESHOLD) return "passed";
    if (score >= BORDERLINE_SCORE_THRESHOLD) return "borderline";
    return "failed";
}

export function getScoreStatusLabel(status: ScoreStatus, value?: number | null | undefined) {
    if (status === "failed") {
        const score = normalizeScore(value);
        if (score !== null && score >= WEAK_MATCH_SCORE_THRESHOLD) return "Weak match";
        return "Not suitable";
    }
    return SCORE_STATUS_LABELS[status];
}

export function getRecommendationLabel(value: number | null | undefined) {
    const status = getScoreStatus(value);
    if (status === "passed") return "Strong match";
    if (status === "borderline") return "Review manually";
    if (status === "failed") {
        const score = normalizeScore(value);
        return score !== null && score >= WEAK_MATCH_SCORE_THRESHOLD ? "Potentially weak fit" : "Reject / Not suitable";
    }
    return "Pending scoring";
}

export function calculateSummary(items: CVLogItem[]): ScreeningSummary {
    const scores = items
        .map((item) => normalizeScore(item.ai_matching_score))
        .filter((score): score is number => score !== null);

    return {
        total: items.length,
        scored: scores.length,
        passed: items.filter((item) => getScoreStatus(item.ai_matching_score) === "passed").length,
        borderline: items.filter((item) => getScoreStatus(item.ai_matching_score) === "borderline").length,
        failed: items.filter((item) => getScoreStatus(item.ai_matching_score) === "failed").length,
        averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
        highestScore: scores.length ? Math.max(...scores) : null,
        lowestScore: scores.length ? Math.min(...scores) : null,
    };
}

export function getSectionScore(detail: MatchingDetail | null | undefined, keys: string[]) {
    const section = detail?.sections?.find((item) => keys.includes(item.key));
    return normalizeScore(section?.score);
}

export function getSectionPoints(detail: MatchingDetail | null | undefined, keys: string[], field: "good" | "missing") {
    return (detail?.sections || [])
        .filter((section) => keys.includes(section.key))
        .flatMap((section) => section[field] || []);
}

function uniqueItems(items: Array<string | null | undefined>) {
    return Array.from(new Set(items.map((item) => (item ?? "").trim()).filter(Boolean)));
}

export function getMatchedItems(detail: MatchingDetail | null | undefined) {
    if (!detail) return [];
    const orderedKeys = [
        "required_skills",
        "project_domain",
        "seniority",
        "responsibility",
        "testing_documentation",
        "language_collaboration",
        "bonus_skills",
    ];
    const grouped = detail.matched ?? {};
    const direct = orderedKeys.flatMap((key) => grouped[key] ?? []);
    if (direct.length > 0) return uniqueItems(direct);
    return uniqueItems(detail.good_points ?? []);
}

export function getMissingSkills(detail: MatchingDetail | null | undefined) {
    if (!detail) return [];
    const grouped = detail.missingOrWeak ?? {};
    const direct = [...(grouped.required_skills ?? []), ...(grouped.bonus_skills ?? [])];
    if (direct.length > 0) return uniqueItems(direct);
    return uniqueItems([
        ...getSectionPoints(detail, ["required_skills", "bonus_skills"], "missing"),
        ...(detail.missing_points ?? []).filter((item) => /skill|stack|framework|language|tool|java|spring|html|css|javascript|typescript|aws|docker|kubernetes|redis|kafka/i.test(item)),
    ]);
}

export function getMissingRequirements(detail: MatchingDetail | null | undefined) {
    if (!detail) return [];
    const grouped = detail.missingOrWeak ?? {};
    const direct = [
        ...(grouped.project_domain ?? []),
        ...(grouped.seniority ?? []),
        ...(grouped.responsibility ?? []),
        ...(grouped.testing_documentation ?? []),
        ...(grouped.language_collaboration ?? []),
        ...(detail.must_have?.missing ?? []),
    ];
    if (direct.length > 0) return uniqueItems(direct);
    return uniqueItems([
        ...getSectionPoints(detail, ["project_domain", "seniority", "responsibility", "testing_documentation", "language_collaboration"], "missing"),
        ...(detail.must_have?.missing ?? []),
    ]);
}

export function hasDetailedMissingCriteria(detail: MatchingDetail | null | undefined) {
    const grouped = detail?.missingOrWeak ?? {};
    return Object.values(grouped).some((items) => Array.isArray(items) && items.length > 0);
}

export function filterCvsByStatus(items: CVLogItem[], status: ScoreStatus | "all") {
    if (status === "all") return items;
    return items.filter((item) => getScoreStatus(item.ai_matching_score) === status);
}

export function filterCvsByExperience(items: CVLogItem[], filter: ExperienceFilter) {
    if (filter === "all") return items;
    return items.filter((item) => {
        const years = item.experience_years ?? 0;
        if (filter === "intern") return years < 1;
        if (filter === "gt1") return years > 1;
        if (filter === "gt3") return years > 3;
        if (filter === "gt5") return years > 5;
        return years > 7;
    });
}

export function sortCvLogs(items: CVLogItem[], mode: CvSortMode) {
    if (mode === "experience") {
        return [...items].sort((a, b) => (b.experience_years ?? -1) - (a.experience_years ?? -1));
    }
    return [...items].sort((a, b) => (normalizeScore(b.ai_matching_score) ?? -1) - (normalizeScore(a.ai_matching_score) ?? -1));
}

export function getJobManagementLabel(status: JobManagementStatus) {
    return JOB_MANAGEMENT_LABELS[status];
}
