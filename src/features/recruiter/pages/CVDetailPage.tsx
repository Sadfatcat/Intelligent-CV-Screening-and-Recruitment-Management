"use client";

import { useState } from "react";
import RadarChart from "@/components/charts/RadarChart";
import { getRecruiterCvFileUrl } from "../services/recruiterApi";
import type { CVLogItem, JobManagementStatus, RecruiterSession } from "../types/recruiterTypes";
import { formatLogTime, formatScore } from "../utils/recruiterFormatters";
import {
    BORDERLINE_SCORE_THRESHOLD,
    hasDetailedMissingCriteria,
    getMatchedItems,
    getJobManagementLabel,
    getMissingRequirements,
    getMissingSkills,
    getRenderableMatchingSections,
    getScoreStatus,
    PASSED_SCORE_THRESHOLD,
    WEAK_MATCH_SCORE_THRESHOLD,
} from "../utils/cvScoringUtils";
import styles from "./CVDetailPage.module.css";

type Props = {
    selectedLog: CVLogItem;
    getManagedJobStatus: (jobId: number) => JobManagementStatus;
    onBack: () => void;
    onDelete: (log: CVLogItem) => void;
    session: RecruiterSession;
};

function scoreColor(score: number | null | undefined): string {
    const s = typeof score === "number" && !Number.isNaN(score) ? Math.min(100, Math.max(0, score)) : null;
    if (s === null) return "var(--muted, #666)";
    if (s >= PASSED_SCORE_THRESHOLD) return "#166534";
    if (s >= BORDERLINE_SCORE_THRESHOLD) return "#1e40af";
    return "#991b1b";
}

function statusBadgeClass(status: ReturnType<typeof getScoreStatus>, styles: Record<string, string>) {
    const map: Record<string, string> = {
        passed: styles.statusPassed,
        borderline: styles.statusBorderline,
        failed: styles.statusFailed,
        not_scored: styles.statusNotScored,
    };
    return map[status] ?? styles.statusNotScored;
}

function statusLabel(status: ReturnType<typeof getScoreStatus>) {
    if (status === "passed") return "Strong match";
    if (status === "borderline") return "Potential match";
    if (status === "failed") return "Not suitable";
    return "Not Scored";
}

export default function CVDetailPage({ selectedLog, getManagedJobStatus, onBack, onDelete, session }: Props) {
    const [missingOpen, setMissingOpen] = useState(false);
    const [sectionOpen, setSectionOpen] = useState(false);

    const detail = selectedLog.matching_detail ?? null;
    const sections = getRenderableMatchingSections(detail);
    const scoreStatus = getScoreStatus(selectedLog.ai_matching_score);
    const hasMissingDetail = hasDetailedMissingCriteria(detail);

    const matchedSkills = getMatchedItems(detail);
    const missingSkills = getMissingSkills(detail);
    const missingRequirements = getMissingRequirements(detail);

    const skillTotal = matchedSkills.length + missingSkills.length;
    const skillMatchPct = skillTotal > 0 ? Math.round((matchedSkills.length / skillTotal) * 100) : 0;

    const radarLabels = sections.slice(0, 7).map((s) => s.label || s.key);
    const radarValues = sections.slice(0, 7).map((s) => (typeof s.score === "number" ? Math.min(100, Math.max(0, s.score)) : 0));

    const jobStatus = getManagedJobStatus(selectedLog.job_id);
    const explanation = detail?.reasoningSummary || detail?.sections?.[0]?.explanation || null;

    const displayScore = typeof selectedLog.ai_matching_score === "number" ? `${formatScore(selectedLog.ai_matching_score)}/100` : "—";

    return (
        <div className={styles.detail}>
            {/* Header bar */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.candidateName}>{selectedLog.candidate_name || "Unnamed Candidate"}</h2>
                    <p className={styles.headerMeta}>
                        {selectedLog.job_title} · {getJobManagementLabel(jobStatus)} · {selectedLog.candidate_email || "No email"} · {formatLogTime(selectedLog.created_at)}
                    </p>
                </div>

                <div className={styles.headerRight}>
                    <span className={styles.scoreNumber} style={{ color: scoreColor(selectedLog.ai_matching_score) }}>
                        {displayScore}
                    </span>
                    <span className={`${styles.statusBadge} ${statusBadgeClass(scoreStatus, styles)}`}>
                        {scoreStatus === "failed" && (selectedLog.ai_matching_score ?? 0) >= WEAK_MATCH_SCORE_THRESHOLD
                            ? "Weak match"
                            : statusLabel(scoreStatus)}
                    </span>
                    <div className={styles.headerActions}>
                        <button type="button" className={styles.btnBack} onClick={onBack}>
                            ← Back to CVs
                        </button>
                        <button type="button" className={styles.btnDelete} onClick={() => onDelete(selectedLog)}>
                            Delete CV
                        </button>
                        {!selectedLog.isMock && (
                            <>
                                <a
                                    className={styles.btnLink}
                                    href={getRecruiterCvFileUrl(session.user_id, selectedLog.application_id, true)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View CV
                                </a>
                                <a
                                    className={styles.btnLink}
                                    href={getRecruiterCvFileUrl(session.user_id, selectedLog.application_id)}
                                >
                                    Download
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail grid */}
            <div className={styles.grid3}>
                {/* Col 1 — Profile Summary */}
                <div className={`${styles.card} ${styles.profileCard}`}>
                    <p className={styles.cardTitle}>Profile Summary</p>
                    <p className={styles.summaryText}>
                        {selectedLog.summary || "Summary not available from backend yet."}
                    </p>
                    <ul className={styles.metaList}>
                        <li className={styles.metaItem}>
                            <span className={styles.metaLabel}>Experience:</span>
                            {selectedLog.experience_years != null ? `${selectedLog.experience_years} years` : "Not available"}
                        </li>
                        <li className={styles.metaItem}>
                            <span className={styles.metaLabel}>Education:</span>
                            {selectedLog.education || "Not available"}
                        </li>
                        {selectedLog.languages && selectedLog.languages.length > 0 && (
                            <li className={styles.metaItem}>
                                <span className={styles.metaLabel}>Languages:</span>
                                {selectedLog.languages.join(", ")}
                            </li>
                        )}
                        {selectedLog.certifications && selectedLog.certifications.length > 0 && (
                            <li className={styles.metaItem}>
                                <span className={styles.metaLabel}>Certifications:</span>
                                {selectedLog.certifications.join(", ")}
                            </li>
                        )}
                    </ul>
                </div>

                {/* Col 2 — Skills Match */}
                <div className={`${styles.card} ${styles.skillsCard}`}>
                    <p className={styles.cardTitle}>Skills Match</p>
                    <ul className={styles.skillList}>
                        {matchedSkills.slice(0, 6).map((item) => (
                            <li className={styles.skillGood} key={`match-${item}`}>
                                <span className={styles.skillIcon}>✓</span>
                                {item}
                            </li>
                        ))}
                        {missingSkills.slice(0, 6).map((item) => (
                            <li className={styles.skillMissing} key={`miss-${item}`}>
                                <span className={styles.skillIcon}>✕</span>
                                {item}
                            </li>
                        ))}
                        {matchedSkills.length === 0 && missingSkills.length === 0 && (
                            <li className={styles.noData}>
                                {(selectedLog.ai_matching_score ?? 0) < BORDERLINE_SCORE_THRESHOLD && !hasMissingDetail
                                    ? "Detailed missing criteria not available."
                                    : "No skills data recorded."}
                            </li>
                        )}
                    </ul>
                    {skillTotal > 0 && (
                        <div className={styles.progressRow}>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${skillMatchPct}%` }} />
                            </div>
                            <span>{matchedSkills.length} / {skillTotal} matched</span>
                        </div>
                    )}
                </div>

                {/* Col 3 — Section Scores */}
                <div className={`${styles.card} ${styles.chartCard}`}>
                    <p className={styles.cardTitle}>Section Scores</p>
                    {radarLabels.length > 0 ? (
                        <RadarChart labels={radarLabels} values={radarValues} height={430} />
                    ) : (
                        <p className={styles.noData}>No section scores available.</p>
                    )}
                </div>
            </div>

            {/* Reason card */}
            <div className={styles.reasonCard}>
                <strong>Reason:</strong>
                {explanation || "Explanation not available from backend yet."}
            </div>

            {/* Accordion 1 — Missing Requirements */}
            <div className={styles.accordion}>
                <button
                    type="button"
                    className={styles.accordionTrigger}
                    onClick={() => setMissingOpen((v) => !v)}
                >
                    Missing Requirements ({missingRequirements.length})
                    <span className={`${styles.accordionChevron} ${missingOpen ? styles.accordionChevronOpen : ""}`}>▼</span>
                </button>
                {missingOpen && (
                    <div className={styles.accordionBody}>
                        {missingRequirements.length > 0 ? (
                            <ul className={styles.missingList}>
                                {missingRequirements.map((item) => (
                                    <li className={styles.missingItem} key={`req-${item}`}>
                                        <span className={styles.missingIcon}>✕</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.emptyNote}>No missing requirements recorded.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Accordion 2 — Full Section Detail */}
            <div className={styles.accordion}>
                <button
                    type="button"
                    className={styles.accordionTrigger}
                    onClick={() => setSectionOpen((v) => !v)}
                >
                    Full Section Detail ({sections.length} sections)
                    <span className={`${styles.accordionChevron} ${sectionOpen ? styles.accordionChevronOpen : ""}`}>▼</span>
                </button>
                {sectionOpen && (
                    <div className={styles.accordionBody}>
                        {sections.length > 0 ? (
                            <table className={styles.sectionTable}>
                                <thead>
                                    <tr>
                                        <th>Section</th>
                                        <th>Score</th>
                                        <th>Matched</th>
                                        <th>Missing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map((s) => (
                                        <tr key={s.key}>
                                            <td>{s.label || s.key}</td>
                                            <td className={styles.scoreCell}>
                                                {typeof s.score === "number" ? `${s.score.toFixed(0)}/100` : "—"}
                                            </td>
                                            <td>{s.good?.length ?? 0}</td>
                                            <td>{s.missing?.length ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.emptyNote}>No section detail available.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
