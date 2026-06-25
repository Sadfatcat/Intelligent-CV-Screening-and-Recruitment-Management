"use client";

import type { CandidateSubmissionItem, JobItem, MatchingDetail } from "../hooks/useCandidateData";
import { normalizeJobImageUrl } from "../utils/candidateJobAssets";
import styles from "../../../app/candidate/page.module.css";
import { useState } from "react";

type Props = {
    submittedJobs: CandidateSubmissionItem[];
    jobs: JobItem[];
    isCvScoring: boolean;
    hasScoringApplication: boolean;
    onBrowseJobs: () => void;
};

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
    if (score >= 85) return "passed";
    if (score >= 50) return "borderline";
    return "failed";
}

function getScoreStatusLabel(value: number | null | undefined) {
    const status = getScoreStatus(value);
    if (status === "passed") return "Passed";
    if (status === "borderline") return "Borderline";
    if (status === "failed") return "Failed";
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
    const sectionGood = (detail?.sections ?? [])
        .filter((s) => (s.good ?? []).length > 0)
        .flatMap((s) => (s.good ?? []).map((p) => `${s.label || s.key}: ${p}`));
    return uniqueItems([...(detail?.good_points ?? []), ...(detail?.must_have?.matched ?? []), ...sectionGood]);
}

function getMissingSkills(detail: MatchingDetail | null | undefined) {
    return uniqueItems([
        ...getSectionPoints(detail, ["skills", "technical_skills", "tools"], "missing"),
        ...(detail?.missing_points ?? []).filter((p) => /skill|tool|framework|language|stack/i.test(p)),
    ]);
}

function getMissingRequirements(detail: MatchingDetail | null | undefined) {
    return uniqueItems([
        ...getSectionPoints(detail, ["requirements", "education", "experience", "languages"], "missing"),
        ...(detail?.must_have?.missing ?? []),
    ]);
}

function renderCriteriaList(items: string[], kind: "good" | "skill" | "requirement", emptyText: string) {
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
            {overflow > 0 && <li className={styles.criteriaMore}>+{overflow} more</li>}
        </ul>
    );
}

export default function AppliedCVsPage({ submittedJobs, jobs, isCvScoring, hasScoringApplication, onBrowseJobs }: Props) {
    const [failedImageIds, setFailedImageIds] = useState<Set<number>>(() => new Set());

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
                <span className={styles.legendChipScore}><i className={`${styles.scoreLegend} ${styles.scorePassed}`}>Passed</i></span>
                <span className={styles.legendChipScore}><i className={`${styles.scoreLegend} ${styles.scoreBorderline}`}>Borderline</i></span>
                <span className={styles.legendChipScore}><i className={`${styles.scoreLegend} ${styles.scoreFailed}`}>Failed</i></span>
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
                        const scoreStatus = getScoreStatus(item.ai_matching_score);
                        const imageUrl = normalizeJobImageUrl(item.image_url || matchedJob?.image_url);
                        const imageFailed = failedImageIds.has(item.application_id);
                        const description = item.description || matchedJob?.description;

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
                                            {renderCriteriaList(fulfilledCriteria, "good", "No matched criteria returned yet.")}
                                        </section>
                                        <section className={styles.criteriaBlock}>
                                            <h4>Missing skills</h4>
                                            {renderCriteriaList(missingSkills, "skill", "No missing skills recorded.")}
                                        </section>
                                        <section className={styles.criteriaBlock}>
                                            <h4>Missing requirements</h4>
                                            {renderCriteriaList(missingRequirements, "requirement", "No required condition missing.")}
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
        </div>
    );
}
