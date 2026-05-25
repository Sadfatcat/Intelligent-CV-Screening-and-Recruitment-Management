import type { CVLogItem, JobManagementStatus, RecruiterJob } from "../types/recruiterTypes";
import { getJobManagementLabel, normalizeScore } from "../utils/cvScoringUtils";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    job: RecruiterJob;
    cvLogs: CVLogItem[];
    jobStatus: JobManagementStatus;
    onClick: () => void;
    onTurnOff: () => void;
    onRestore: () => void;
    onDelete: () => void;
};

function jobStatusClass(status: JobManagementStatus) {
    const map: Record<JobManagementStatus, string> = {
        draft: styles.jobStatusTurnedOff,
        active: styles.jobStatusActive,
        turned_off: styles.jobStatusTurnedOff,
        closed: styles.jobStatusDeleted,
        deleted: styles.jobStatusDeleted,
    };
    return map[status];
}

export default function JobCard({ job, cvLogs, jobStatus, onClick, onTurnOff, onRestore, onDelete }: Props) {
    const jobLogs = cvLogs.filter((log) => log.job_id === job.id);
    const scoredCount = jobLogs.filter((log) => normalizeScore(log.ai_matching_score) !== null).length;

    return (
        <tr
            className={`${styles.clickableRow} ${jobStatus === "turned_off" ? styles.tableInactiveRow : ""}`}
            onClick={onClick}
        >
            <td>
                {job.title}{" "}
                {job.isMock && <span className={styles.mockBadge}>Mock</span>}
            </td>
            <td>{job.company_name}</td>
            <td>{job.level}</td>
            <td>{job.location}</td>
            <td>{job.salary || "-"}</td>
            <td>
                <span className={`${styles.jobStatusPill} ${jobStatusClass(jobStatus)}`}>
                    {getJobManagementLabel(jobStatus)}
                </span>
            </td>
            <td>{jobLogs.length}</td>
            <td>{scoredCount}</td>
            <td>
                <div className={styles.jobActionGroup}>
                    {jobStatus === "active" ? (
                        <button
                            className={styles.turnOffJobBtn}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onTurnOff(); }}
                        >
                            Turn Off
                        </button>
                    ) : (
                        <button
                            className={styles.restoreJobBtn}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRestore(); }}
                        >
                            Restore
                        </button>
                    )}
                    <button
                        className={styles.deleteCvBtn}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
