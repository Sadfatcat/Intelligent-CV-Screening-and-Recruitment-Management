"use client";

import { useMemo } from "react";
import { DashboardDoughnutChart, DashboardLineChart } from "@/components/charts/DashboardCharts";
import type { CVLogItem, JobManagementStatus, RecruiterJob } from "../types/recruiterTypes";
import { formatLogTime, formatScore } from "../utils/recruiterFormatters";
import { getJobManagementLabel, getScoreStatus, normalizeScore } from "../utils/cvScoringUtils";
import { calculateSummary } from "../utils/cvScoringUtils";
import styles from "../../../app/recruiter_UI/page.module.css";

type DashboardRange = "today" | "7d" | "30d" | "all";

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

function isWithinRange(value: string | null | undefined, range: DashboardRange) {
    if (!value) return range === "all";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return range === "all";
    if (range === "all") return true;
    const now = new Date();
    if (range === "today") return date.toDateString() === now.toDateString();
    const days = range === "7d" ? 7 : 30;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return date >= start;
}

function formatDashboardDate(value: string) {
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
        { label: "Failed", value: allScreeningSummary.failed, color: "#f4a6a6" },
        { label: "Passed", value: allScreeningSummary.passed, color: "#9bd8b2" },
        { label: "Borderline", value: allScreeningSummary.borderline, color: "#f4c48d" },
    ], [allScreeningSummary]);

    const scoreDistribution = useMemo(() => {
        const buckets = [
            { label: "Strong Match", range: "90-100%", value: 0, color: "#166534" },
            { label: "Good Match", range: "76-89%", value: 0, color: "#60a5fa" },
            { label: "Consider Match", range: "50-75%", value: 0, color: "#f4a261" },
            { label: "Weak Match", range: "Below 50%", value: 0, color: "#ef9a9a" },
        ];
        recruiterCvLogs.forEach((log) => {
            const score = normalizeScore(log.ai_matching_score);
            if (score === null) return;
            if (score >= 90) buckets[0].value += 1;
            else if (score >= 76) buckets[1].value += 1;
            else if (score >= 50) buckets[2].value += 1;
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
            const key = date.toISOString().slice(0, 10);
            const current = grouped.get(key) ?? { date: key, newApplications: 0, reviewedApplications: 0 };
            current.newApplications += 1;
            if (log.status !== "pending") current.reviewedApplications += 1;
            grouped.set(key, current);
        });
        return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [dashboardLogs]);

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
                highMatchCount: scores.filter((s) => s >= 90).length,
                pendingReviews: logs.filter((log) => log.status === "pending").length,
            };
        });
    }, [getManagedJobStatus, managedRecruiterJobs, recruiterCvLogs]);

    const RANGES: DashboardRange[] = ["today", "7d", "30d", "all"];
    const rangeLabel: Record<DashboardRange, string> = { today: "Today", "7d": "Last 7 Days", "30d": "Last 30 Days", all: "All Time" };

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
                    <DashboardDoughnutChart items={screeningDistribution} textColor="#200080" />
                </section>
                <section className={`${styles.card} ${styles.panelCard} ${styles.chartCard}`}>
                    <div className={styles.panelTitleRow}><div><h3>Matching Score Distribution</h3></div></div>
                    <DashboardDoughnutChart items={scoreDistribution} textColor="#200080" />
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
                        getLabel={(point) => formatDashboardDate(point.date)}
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
