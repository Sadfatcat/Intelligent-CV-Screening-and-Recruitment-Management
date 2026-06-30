"use client";

import { useMemo } from "react";
import { DashboardDoughnutChart, DashboardLineChart } from "@/components/charts/DashboardCharts";
import type { CVLogItem, JobManagementStatus, RecruiterJob } from "../types/recruiterTypes";
import { formatLogTime, formatScore } from "../utils/recruiterFormatters";
import { BORDERLINE_SCORE_THRESHOLD, getJobManagementLabel, getScoreStatus, normalizeScore, PASSED_SCORE_THRESHOLD } from "../utils/cvScoringUtils";
import { calculateSummary } from "../utils/cvScoringUtils";
import styles from "../../../app/recruiter_UI/page.module.css";

type DashboardRange = "7d" | "30d" | "all";
type TimeRange = DashboardRange | "today";

type Props = {
    recruiterCvLogs: CVLogItem[];
    managedRecruiterJobs: RecruiterJob[];
    getManagedJobStatus: (jobId: number) => JobManagementStatus;
    dashboardRange: DashboardRange;
    onSetDashboardRange: (r: DashboardRange) => void;
    onOpenJobs: () => void;
    onOpenApplicationsForJob: (jobId: number) => void;
    onOpenApplications: () => void;
};

function toLocalDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toMonthKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

function getRangeDateKeys(range: DashboardRange) {
    if (range === "all") return [];
    const now = new Date();
    const days = range === "7d" ? 7 : 30;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    return Array.from({ length: days }, (_, index) => {
        const current = new Date(start);
        current.setDate(start.getDate() + index);
        return toLocalDateKey(current);
    });
}

function getAllTimeMonthKeys() {
    const current = new Date();
    const start = new Date(2026, 2, 1);
    const end = new Date(current.getFullYear(), current.getMonth(), 1);
    const months: string[] = [];

    for (const cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
        months.push(toMonthKey(cursor));
    }

    return months;
}

function isWithinRange(value: string | null | undefined, range: TimeRange) {
    if (!value) return range === "all";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return range === "all";
    if (range === "all") return true;
    const now = new Date();
    const days = range === "7d" ? 7 : 30;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return date >= start;
}

function formatDashboardDate(value: string, range: DashboardRange) {
    if (range === "all") {
        const [year, month] = value.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

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

export default function DashboardPage({
    recruiterCvLogs,
    managedRecruiterJobs,
    getManagedJobStatus,
    dashboardRange,
    onSetDashboardRange,
    onOpenJobs,
    onOpenApplicationsForJob,
    onOpenApplications,
}: Props) {
    const allScreeningSummary = useMemo(() => calculateSummary(recruiterCvLogs), [recruiterCvLogs]);

    const dashboardSummary = useMemo(() => {
        const scores = recruiterCvLogs
            .map((log) => normalizeScore(log.ai_matching_score))
            .filter((s): s is number => s !== null);
        return {
            activeJobs: managedRecruiterJobs.filter((job) => getManagedJobStatus(job.id) === "active").length,
            totalApplications: recruiterCvLogs.length,
            newApplications: recruiterCvLogs.filter((log) => isWithinRange(log.created_at, "today")).length,
            pendingReviews: recruiterCvLogs.filter((log) => log.status === "pending").length,
            averageScore: scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null,
        };
    }, [getManagedJobStatus, managedRecruiterJobs, recruiterCvLogs]);

    const screeningDistribution = useMemo(() => [
        { label: "Under Threshold", value: allScreeningSummary.failed, color: "#f4a6a6" },
        { label: "Strong Match", value: allScreeningSummary.passed, color: "#9bd8b2" },
        { label: "Potential Match", value: allScreeningSummary.borderline, color: "#f4c48d" },
    ], [allScreeningSummary]);

    const scoreDistribution = useMemo(() => {
        const buckets = [
            { label: "Strong Match", range: "75-100%", value: 0, color: "#166534" },
            { label: "Potential Match", range: "60-74%", value: 0, color: "#1e40af" },
            { label: "Weak Match", range: "45-59%", value: 0, color: "#f4c48d" },
            { label: "Not Suitable", range: "0-44%", value: 0, color: "#ef9a9a" },
        ];
        recruiterCvLogs.forEach((log) => {
            const score = normalizeScore(log.ai_matching_score);
            if (score === null) return;
            if (score >= PASSED_SCORE_THRESHOLD) buckets[0].value += 1;
            else if (score >= BORDERLINE_SCORE_THRESHOLD) buckets[1].value += 1;
            else if (score >= 45) buckets[2].value += 1;
            else buckets[3].value += 1;
        });
        return buckets;
    }, [recruiterCvLogs]);

    const dashboardLogs = useMemo(
        () => recruiterCvLogs.filter((log) => isWithinRange(log.created_at, dashboardRange)),
        [dashboardRange, recruiterCvLogs]
    );

    const applicationsOverTime = useMemo(() => {
        const grouped = new Map<string, { date: string; newApplications: number; reviewedApplications: number }>();
        dashboardLogs.forEach((log) => {
            const date = new Date(log.created_at);
            if (Number.isNaN(date.getTime())) return;
            const key = dashboardRange === "all" ? toMonthKey(date) : toLocalDateKey(date);
            const current = grouped.get(key) ?? { date: key, newApplications: 0, reviewedApplications: 0 };
            current.newApplications += 1;
            if (log.status !== "pending") current.reviewedApplications += 1;
            grouped.set(key, current);
        });

        if (dashboardRange === "all") {
            return getAllTimeMonthKeys().map((date) => {
                const existing = grouped.get(date);
                return existing ?? { date, newApplications: 0, reviewedApplications: 0 };
            });
        }

        return getRangeDateKeys(dashboardRange).map((date) => {
            const existing = grouped.get(date);
            return existing ?? { date, newApplications: 0, reviewedApplications: 0 };
        });
    }, [dashboardLogs, dashboardRange]);

    const jobPerformanceRows = useMemo(() => {
        return managedRecruiterJobs.map((job) => {
            const logs = recruiterCvLogs.filter((log) => log.job_id === job.id);
            const scores = logs.map((log) => normalizeScore(log.ai_matching_score)).filter((s): s is number => s !== null);
            return {
                job,
                status: getManagedJobStatus(job.id),
                totalApplications: logs.length,
                newCvs: logs.filter((log) => isWithinRange(log.created_at, "today")).length,
                averageScore: scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null,
                highMatchCount: scores.filter((s) => s >= PASSED_SCORE_THRESHOLD).length,
                pendingReviews: logs.filter((log) => log.status === "pending").length,
            };
        });
    }, [getManagedJobStatus, managedRecruiterJobs, recruiterCvLogs]);

    const RANGES: DashboardRange[] = ["7d", "30d", "all"];
    const rangeLabel: Record<DashboardRange, string> = { "7d": "Last 7 Days", "30d": "Last 30 Days", all: "All Time" };

    return (
        <>
            <section className={`${styles.card} ${styles.panelCard} ${styles.dashboardSummaryPanel}`}>
                <div className={styles.panelTitleRow}>
                    <div><h3>Dashboard Summary</h3></div>
                </div>
                <div className={styles.dashboardSummaryGrid}>
                    <span><small>Active Jobs</small><strong>{dashboardSummary.activeJobs}</strong></span>
                    <span><small>Total Applications</small><strong>{dashboardSummary.totalApplications}</strong></span>
                    <span><small>New Applications</small><strong>{dashboardSummary.newApplications}</strong></span>
                    <span><small>Pending Reviews</small><strong>{dashboardSummary.pendingReviews}</strong></span>
                    <span className={styles.dashboardSummaryCompact}>
                        <small>Average Matching Score</small>
                        <strong>{formatScore(dashboardSummary.averageScore)}</strong>
                    </span>
                </div>
            </section>

            <div className={styles.dashboardChartsRow}>
                <section className={`${styles.card} ${styles.panelCard} ${styles.chartCard}`}>
                    <div className={styles.panelTitleRow}><div><h3>Screening Result Distribution</h3></div></div>
                    <div className={styles.chartInnerLayer}>
                        <DashboardDoughnutChart items={screeningDistribution} textColor="#200080" />
                    </div>
                </section>
                <section className={`${styles.card} ${styles.panelCard} ${styles.chartCard}`}>
                    <div className={styles.panelTitleRow}><div><h3>Matching Score Distribution</h3></div></div>
                    <div className={styles.chartInnerLayer}>
                        <DashboardDoughnutChart items={scoreDistribution} textColor="#200080" />
                    </div>
                </section>
            </div>

            <section className={`${styles.card} ${styles.panelCard} ${styles.lineChartCard}`} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.panelTitleRow}>
                    <div><h3>Applications Over Time</h3></div>
                    <div className={styles.rangeControl}>
                        {RANGES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                className={`${styles.rangeButton} ${dashboardRange === r ? styles.rangeButtonActive : ""}`}
                                onClick={() => onSetDashboardRange(r)}
                            >
                                {rangeLabel[r]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.lineChart}>
                    <DashboardLineChart
                        points={applicationsOverTime}
                        getLabel={(point) => formatDashboardDate(point.date, dashboardRange)}
                        emptyText="No applications in this period."
                        textColor="#200080"
                        series={[
                            { key: "newApplications", label: "New applications", color: "#200080" },
                            { key: "reviewedApplications", label: "Reviewed applications", color: "#15803d" },
                        ]}
                    />
                </div>
            </section>

            <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.panelTitleRow}>
                    <div><h3>Job Performance</h3></div>
                    <button className={styles.clearFilterBtn} type="button" onClick={onOpenJobs}>
                        Open Job Management
                    </button>
                </div>
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Job Title</th>
                                <th>Status</th>
                                <th>Total Applications</th>
                                <th>New CVs</th>
                                <th>Average Score</th>
                                <th>High Match Count</th>
                                <th>Pending Reviews</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobPerformanceRows.map((row) => (
                                <tr key={row.job.id}>
                                    <td>{row.job.title}</td>
                                    <td>
                                        <span className={`${styles.jobStatusPill} ${jobStatusClass(row.status)}`}>
                                            {getJobManagementLabel(row.status)}
                                        </span>
                                    </td>
                                    <td>{row.totalApplications}</td>
                                    <td>{row.newCvs}</td>
                                    <td>{formatScore(row.averageScore)}</td>
                                    <td>{row.highMatchCount}</td>
                                    <td>{row.pendingReviews}</td>
                                    <td>
                                        <button className={styles.clearFilterBtn} type="button" onClick={() => onOpenApplicationsForJob(row.job.id)}>
                                            View CVs
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {jobPerformanceRows.length === 0 && (
                                <tr><td colSpan={8}>No jobs available.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.panelTitleRow}>
                    <div><h3>Activity Logs</h3></div>
                    <button className={styles.clearFilterBtn} type="button" onClick={onOpenApplications}>
                        Open Submitted CVs
                    </button>
                </div>
                <ul className={styles.dashboardActivityList}>
                    {recruiterCvLogs.slice(0, 8).map((log) => (
                        <li key={log.log_id}>
                            <span>{formatLogTime(log.created_at)}</span>
                            <strong>{log.candidate_name || "Candidate"}</strong>
                            <em>submitted a CV for {log.job_title}</em>
                        </li>
                    ))}
                    {recruiterCvLogs.length === 0 && <li>No activity yet.</li>}
                </ul>
            </section>
        </>
    );
}
