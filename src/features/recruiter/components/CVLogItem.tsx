import type { CVLogItem } from "../types/recruiterTypes";
import { formatLogTime, formatScore } from "../utils/recruiterFormatters";
import { getScoreStatus, getScoreStatusLabel, getSectionPoints, normalizeScore } from "../utils/cvScoringUtils";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    log: CVLogItem;
    rank: number;
    onClick: () => void;
};

function scoreStatusClass(status: ReturnType<typeof getScoreStatus>) {
    const map: Record<string, string> = {
        passed: styles.statusPassed,
        borderline: styles.statusBorderline,
        failed: styles.statusFailed,
        not_scored: styles.statusNotScored,
    };
    return map[status] ?? styles.statusNotScored;
}

export default function CVLogItemRow({ log, rank, onClick }: Props) {
    const status = getScoreStatus(log.ai_matching_score);
    const missing = getSectionPoints(log.matching_detail, ["technical_skills", "programming_languages"], "missing").slice(0, 3);

    return (
        <tr className={styles.clickableRow} onClick={onClick}>
            <td className={styles.tableSoftText}>#{rank}</td>
            <td><strong>{log.candidate_name || "-"}</strong></td>
            <td className={styles.tableSoftText}>{log.candidate_email || "-"}</td>
            <td className={styles.tableSoftText}>{log.candidate_phone || "-"}</td>
            <td><strong>{log.job_title || "-"}</strong></td>
            <td>
                <strong>
                    {log.experience_years != null
                        ? `${formatScore(normalizeScore(log.experience_years))} yrs`
                        : "-"}
                </strong>
            </td>
            <td>
                <span className={`${styles.statusBadge} ${scoreStatusClass(status)}`}>
                    {getScoreStatusLabel(status)}
                </span>
            </td>
            <td><strong>{formatScore(log.ai_matching_score)}/100</strong></td>
            <td className={styles.tableSoftText}>
                <span className={styles.strongMuted}>
                    {missing.length ? missing.join(", ") : "No missing skills"}
                </span>
            </td>
            <td className={styles.tableSoftText}>{formatLogTime(log.created_at)}</td>
        </tr>
    );
}
