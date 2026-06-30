"use client";

import type { CandidateSubmissionItem, JobItem, MatchingDetail } from "../hooks/useCandidateData";
import { normalizeJobImageUrl } from "../utils/candidateJobAssets";
import styles from "../../../app/candidate/page.module.css";
import { useEffect, useState } from "react";

const PASSED_SCORE_THRESHOLD = 75;
const BORDERLINE_SCORE_THRESHOLD = 60;
const WEAK_MATCH_SCORE_THRESHOLD = 45;

type Props = {
    submittedJobs: CandidateSubmissionItem[];
    jobs: JobItem[];
    isCvScoring: boolean;
    hasScoringApplication: boolean;
    onBrowseJobs: () => void;
};

type CriteriaKind = "good" | "skill" | "requirement";

type DetailModalState = {
    title: string;
    subtitle: string;
    focus: CriteriaKind;
    fulfilledCriteria: string[];
    missingSkills: string[];
    missingRequirements: string[];
} | null;

function normalizeScore(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    return Math.min(100, Math.max(0, value));
}

function formatScore(value: number | null | undefined) {
    const s = normalizeScore(value);
    if (s === null) return "-";
    return s.toFixed(0);
}

function formatSubmittedTime(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getScoreStatus(value: number | null | undefined) {
    const score = normalizeScore(value);
    if (score === null) return "pending";
    if (score >= PASSED_SCORE_THRESHOLD) return "passed";
    if (score >= BORDERLINE_SCORE_THRESHOLD) return "borderline";
    return "failed";
}

function getScoreStatusLabel(value: number | null | undefined) {
    const status = getScoreStatus(value);
    const score = normalizeScore(value);
    if (status === "passed") return "Strong match";
    if (status === "borderline") return "Potential match";
    if (status === "failed") return score !== null && score >= WEAK_MATCH_SCORE_THRESHOLD ? "Weak match" : "Not suitable";
    return "Pending";
}

function uniqueItems(items: Array<string | null | undefined>) {
    return Array.from(new Set(items.map((item) => (item ?? "").trim()).filter(Boolean)));
}

function getSectionsByKey(detail: MatchingDetail | null | undefined, keys: string[]) {
    return (detail?.sections ?? []).filter((s) => keys.includes(s.key));
}

function getSectionPoints(detail: MatchingDetail | null | undefined, keys: string[], field: "good" | "missing") {
    return getSectionsByKey(detail, keys).flatMap((s) => s[field] ?? []);
}

function getFulfilledCriteria(detail: MatchingDetail | null | undefined) {
    const grouped = detail?.matched ?? {};
    const orderedKeys = [
        "required_skills",
        "project_domain",
        "seniority",
        "responsibility",
        "testing_documentation",
        "language_collaboration",
        "bonus_skills",
    ];
    const directMatches = orderedKeys.flatMap((key) => grouped[key] ?? []);
    if (directMatches.length > 0) return uniqueItems(directMatches);

    const sectionGood = (detail?.sections ?? [])
        .filter((s) => (s.good ?? []).length > 0)
        .flatMap((s) => (s.good ?? []).map((p) => `${s.label || s.key}: ${p}`));
    return uniqueItems([...(detail?.good_points ?? []), ...(detail?.must_have?.matched ?? []), ...sectionGood]);
}

function getMissingSkills(detail: MatchingDetail | null | undefined) {
    const grouped = detail?.missingOrWeak ?? {};
    const directMissing = [...(grouped.required_skills ?? []), ...(grouped.bonus_skills ?? [])];
    if (directMissing.length > 0) return uniqueItems(directMissing);

    return uniqueItems([
        ...getSectionPoints(detail, ["required_skills", "bonus_skills"], "missing"),
        ...(detail?.missing_points ?? []).filter((p) => /skill|tool|framework|language|stack|java|spring|html|css|javascript|typescript|aws|docker|kubernetes|redis|kafka/i.test(p)),
    ]);
}

function getMissingRequirements(detail: MatchingDetail | null | undefined) {
    const grouped = detail?.missingOrWeak ?? {};
    const directMissing = [
        ...(grouped.project_domain ?? []),
        ...(grouped.seniority ?? []),
        ...(grouped.responsibility ?? []),
        ...(grouped.testing_documentation ?? []),
        ...(grouped.language_collaboration ?? []),
        ...(detail?.must_have?.missing ?? []),
    ];
    if (directMissing.length > 0) return uniqueItems(directMissing);

    return uniqueItems([
        ...getSectionPoints(detail, ["project_domain", "seniority", "responsibility", "testing_documentation", "language_collaboration"], "missing"),
        ...(detail?.must_have?.missing ?? []),
    ]);
}

function hasDetailedMissingCriteria(detail: MatchingDetail | null | undefined) {
    const grouped = detail?.missingOrWeak ?? {};
    return Object.values(grouped).some((items) => Array.isArray(items) && items.length > 0);
}

function renderCriteriaList(
    items: string[],
    kind: CriteriaKind,
    emptyText: string,
    onExpand: ((kind: CriteriaKind) => void) | null,
) {
    if (items.length === 0) return <p className={styles.criteriaEmpty}>{emptyText}</p>;
    const visible = items.slice(0, 5);
    const overflow = items.length - visible.length;
    return (
        <ul className={styles.criteriaList}>
            {visible.map((item) => (
                <li className={styles.criteriaItem} key={`${kind}-${item}`}>
                    <span className={`${styles.criteriaIcon} ${styles[`criteriaIcon${kind[0].toUpperCase()}${kind.slice(1)}`]}`}>
                        {kind === "good" ? "✓" : "✕"}
                    </span>
                    <span>{item}</span>
                </li>
            ))}
            {overflow > 0 && (
                <li>
                    <button type="button" className={styles.criteriaMoreButton} onClick={() => onExpand?.(kind)}>
                        +{overflow} more
                    </button>
                </li>
            )}
        </ul>
    );
}

function renderFullCriteriaList(items: string[], kind: CriteriaKind, emptyText: string) {
    if (items.length === 0) return <p className={styles.criteriaEmpty}>{emptyText}</p>;
    return (
        <ul className={styles.criteriaModalList}>
            {items.map((item) => (
                <li className={styles.criteriaItem} key={`${kind}-full-${item}`}>
                    <span className={`${styles.criteriaIcon} ${styles[`criteriaIcon${kind[0].toUpperCase()}${kind.slice(1)}`]}`}>
                        {kind === "good" ? "✓" : kind === "requirement" ? "!" : "✕"}
                    </span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function AppliedCVsPage({ submittedJobs, jobs, isCvScoring, hasScoringApplication, onBrowseJobs }: Props) {
    const [failedImageIds, setFailedImageIds] = useState<Set<number>>(() => new Set());
    const [detailModal, setDetailModal] = useState<DetailModalState>(null);

    useEffect(() => {
        if (!detailModal) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setDetailModal(null);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [detailModal]);

    return (
        <div className={styles.appliedWorkspace}>
            <div className={styles.appliedHeader}>
                <div>
                    <h2>Applied CVs</h2>
                    <p>Review the jobs you applied to and the CV/JD matching result.</p>
                </div>
                <span>{submittedJobs.length} applications</span>
            </div>

            <div className={styles.legendRow}>
                <span className={styles.legendChipGood}><i className={`${styles.legendIcon} ${styles.criteriaIconGood}`}>✓</i>Matched criteria</span>
                <span className={styles.legendChipSkill}><i className={`${styles.legendIcon} ${styles.criteriaIconSkill}`}>✕</i>Missing skill, can be improved</span>
                <span className={styles.legendChipRequirement}><i className={`${styles.legendIcon} ${styles.criteriaIconRequirement}`}>✕</i>Missing required condition</span>
                <span className={styles.legendChipScore}><i className={`${styles.scoreLegend} ${styles.scorePassed}`}>Strong match</i></span>
                <span className={styles.legendChipScore}><i className={`${styles.scoreLegend} ${styles.scoreBorderline}`}>Potential match</i></span>
                <span className={styles.legendChipScore}><i className={`${styles.scoreLegend} ${styles.scoreFailed}`}>Weak / Not suitable</i></span>
            </div>

            {submittedJobs.length === 0 ? (
                <div className={styles.appliedEmpty}>
                    <p>You have not submitted any CV yet.</p>
                    <button type="button" className={styles.subTabButton} onClick={onBrowseJobs}>
                        Browse jobs
                    </button>
                </div>
            ) : (
                <div className={styles.appliedList}>
                    {submittedJobs.map((item) => {
                        const isScoring = item.status === "scoring";
                        const matchedJob = jobs.find((j) => j.id === item.job_id) ?? null;
                        const fulfilledCriteria = getFulfilledCriteria(item.matching_detail);
                        const missingSkills = getMissingSkills(item.matching_detail);
                        const missingRequirements = getMissingRequirements(item.matching_detail);
                        const hasMissingDetail = hasDetailedMissingCriteria(item.matching_detail);
                        const scoreStatus = getScoreStatus(item.ai_matching_score);
                        const imageUrl = normalizeJobImageUrl(item.image_url || matchedJob?.image_url);
                        const imageFailed = failedImageIds.has(item.application_id);
                        const description = item.description || matchedJob?.description;
                        const openDetailModal = (focus: CriteriaKind) => setDetailModal({
                            title: item.job_title,
                            subtitle: `${item.company_name} | ${item.level} | ${item.location}`,
                            focus,
                            fulfilledCriteria,
                            missingSkills,
                            missingRequirements,
                        });

                        return (
                            <article className={styles.applicationCard} key={item.application_id}>
                                <div className={styles.applicationHero}>
                                    {imageUrl && !imageFailed ? (
                                        <img
                                            src={imageUrl}
                                            alt={item.job_title}
                                            className={styles.applicationImage}
                                            onError={() => setFailedImageIds((current) => new Set(current).add(item.application_id))}
                                        />
                                    ) : (
                                        <div className={styles.applicationImageFallback}>{item.company_name.charAt(0).toUpperCase()}</div>
                                    )}
                                    <div className={styles.applicationIntro}>
                                        <div className={styles.applicationTitleRow}>
                                            <div>
                                                <h3>{item.job_title}</h3>
                                                <p>{item.company_name} | {item.level} | {item.location}</p>
                                            </div>
                                            <div className={styles.scoreBox}>
                                                {isScoring ? (
                                                    <>
                                                        <div className={styles.scoreBoxSpinner} aria-hidden="true">
                                                            <span /><span /><span />
                                                        </div>
                                                        <strong className={styles.scoreBoxWaiting}>Waiting</strong>
                                                        <small>for scoring</small>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`${styles.scorePill} ${styles[`score${scoreStatus[0].toUpperCase()}${scoreStatus.slice(1)}`]}`}>
                                                            {getScoreStatusLabel(item.ai_matching_score)}
                                                        </span>
                                                        <strong>{formatScore(item.ai_matching_score)}</strong>
                                                        <small>matching score</small>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.applicationMetaGrid}>
                                            <span>Status: {item.status}</span>
                                            <span>Submitted: {formatSubmittedTime(item.submitted_at)}</span>
                                            <span>Deadline: {item.deadline || matchedJob?.deadline || "-"}</span>
                                            <span>Salary: {item.salary || matchedJob?.salary || "-"}</span>
                                            <span>Contact: {item.direct_contact || matchedJob?.direct_contact || "-"}</span>
                                        </div>
                                        {description && <p className={styles.applicationDescription}>{description}</p>}
                                    </div>
                                </div>

                                {!isScoring && (
                                    <div className={styles.criteriaGrid}>
                                        <section className={styles.criteriaBlock}>
                                            <h4>Matched in CV</h4>
                                            {renderCriteriaList(fulfilledCriteria, "good", "No matched criteria returned yet.", openDetailModal)}
                                        </section>
                                        <section className={styles.criteriaBlock}>
                                            <h4>Missing skills</h4>
                                            {renderCriteriaList(
                                                missingSkills,
                                                "skill",
                                                !hasMissingDetail && (item.ai_matching_score ?? 0) < BORDERLINE_SCORE_THRESHOLD
                                                    ? "Detailed missing criteria not available."
                                                    : "No missing skills recorded.",
                                                openDetailModal,
                                            )}
                                        </section>
                                        <section className={styles.criteriaBlock}>
                                            <h4>Missing requirements</h4>
                                            {renderCriteriaList(missingRequirements, "requirement", "No required condition missing.", openDetailModal)}
                                        </section>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {(isCvScoring || hasScoringApplication) && submittedJobs.length === 0 && (
                <div className={styles.scoringOverlay} aria-live="polite" aria-busy="true">
                    <div className={styles.scoringSpinner}><span /><span /><span /></div>
                    <p>Please wait...</p>
                </div>
            )}

            {detailModal && (
                <div className={styles.criteriaModalOverlay} onClick={() => setDetailModal(null)} role="presentation">
                    <div className={styles.criteriaModal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Matching details">
                        <button type="button" className={styles.criteriaModalClose} onClick={() => setDetailModal(null)} aria-label="Close matching details">
                            x
                        </button>
                        <div className={styles.criteriaModalHeader}>
                            <h3>Matching Details</h3>
                            <p>{detailModal.title}</p>
                            <span>{detailModal.subtitle}</span>
                        </div>
                        <div className={styles.criteriaModalGrid}>
                            <section className={`${styles.criteriaModalColumn} ${detailModal.focus === "good" ? styles.criteriaModalColumnActive : ""}`}>
                                <div className={styles.criteriaModalColumnHeader}>
                                    <h4>Matched in CV</h4>
                                    <span>{detailModal.fulfilledCriteria.length}</span>
                                </div>
                                {renderFullCriteriaList(detailModal.fulfilledCriteria, "good", "No matched criteria returned yet.")}
                            </section>
                            <section className={`${styles.criteriaModalColumn} ${detailModal.focus === "skill" ? styles.criteriaModalColumnActive : ""}`}>
                                <div className={styles.criteriaModalColumnHeader}>
                                    <h4>Missing skills</h4>
                                    <span>{detailModal.missingSkills.length}</span>
                                </div>
                                {renderFullCriteriaList(detailModal.missingSkills, "skill", "Detailed missing criteria not available.")}
                            </section>
                            <section className={`${styles.criteriaModalColumn} ${detailModal.focus === "requirement" ? styles.criteriaModalColumnActive : ""}`}>
                                <div className={styles.criteriaModalColumnHeader}>
                                    <h4>Missing requirements</h4>
                                    <span>{detailModal.missingRequirements.length}</span>
                                </div>
                                {renderFullCriteriaList(detailModal.missingRequirements, "requirement", "No required condition missing.")}
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
