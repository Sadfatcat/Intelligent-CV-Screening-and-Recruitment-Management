"use client";

import { useMemo, useState } from "react";
import JobCard from "../components/JobCard";
import type { CVLogItem, JobManagementStatus, RecruiterJob } from "../types/recruiterTypes";
import { calculateSummary } from "../utils/cvScoringUtils";
import { formatScore } from "../utils/recruiterFormatters";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    managedRecruiterJobs: RecruiterJob[];
    recruiterCvLogs: CVLogItem[];
    getManagedJobStatus: (jobId: number) => JobManagementStatus;
    onOpenUpload: () => void;
    onSelectJob: (jobId: number) => void;
    onTurnOff: (jobId: number) => void;
    onRestore: (jobId: number) => void;
    onDelete: (jobId: number, title?: string) => void;
    selectedJobId: number | null;
    isScoringSummaryOpen: boolean;
    onCloseSummary: () => void;
};

export default function JobManagementPage({
    managedRecruiterJobs,
    recruiterCvLogs,
    getManagedJobStatus,
    onOpenUpload,
    onSelectJob,
    onTurnOff,
    onRestore,
    onDelete,
    selectedJobId,
    isScoringSummaryOpen,
    onCloseSummary,
}: Props) {
    const [jdSearchInput, setJdSearchInput] = useState("");
    const [jdSearchTerm, setJdSearchTerm] = useState("");
    const [jobPage, setJobPage] = useState(1);
    const [jobStatusFilter, setJobStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");

    const filteredJobs = useMemo(() => {
        const q = jdSearchTerm.trim().toLowerCase();
        return managedRecruiterJobs.filter((job) => {
            const status = getManagedJobStatus(job.id);
            const matchesStatus =
                jobStatusFilter === "all"
                    ? true
                    : jobStatusFilter === "active"
                        ? status === "active"
                        : jobStatusFilter === "draft"
                            ? status === "draft"
                            : status !== "active" && status !== "draft";
            const matchesQuery = !q || [job.title, job.company_name, job.location, job.level].filter(Boolean).join(" ").toLowerCase().includes(q);
            return matchesStatus && matchesQuery;
        });
    }, [getManagedJobStatus, jdSearchTerm, jobStatusFilter, managedRecruiterJobs]);

    const paginatedJobs = useMemo(() => {
        const start = (jobPage - 1) * 5;
        return filteredJobs.slice(start, start + 5);
    }, [filteredJobs, jobPage]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / 5));

    const selectedJob = useMemo(
        () => managedRecruiterJobs.find((j) => j.id === selectedJobId) ?? null,
        [managedRecruiterJobs, selectedJobId]
    );

    const screeningSummary = useMemo(() => {
        if (!selectedJobId) return null;
        const scopedLogs = recruiterCvLogs.filter((log) => log.job_id === selectedJobId);
        return calculateSummary(scopedLogs);
    }, [recruiterCvLogs, selectedJobId]);
    const activeCount = managedRecruiterJobs.filter((job) => getManagedJobStatus(job.id) === "active").length;
    const draftCount = managedRecruiterJobs.filter((job) => getManagedJobStatus(job.id) === "draft").length;
    const archivedCount = managedRecruiterJobs.filter((job) => getManagedJobStatus(job.id) !== "active" && getManagedJobStatus(job.id) !== "draft").length;

    function submitSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const nextTerm = jdSearchInput.trim();
        const matches = managedRecruiterJobs.filter((job) => job.title.toLowerCase().includes(nextTerm.toLowerCase()));
        setJdSearchTerm(nextTerm);
        setJobPage(1);
        if (nextTerm && matches.length === 1) {
            onSelectJob(matches[0].id);
        }
    }

    return (
        <>
            <section className={`${styles.card} ${styles.panelCard} ${styles.dashboardSummaryPanel}`}>
                <div className={styles.panelTitleRow}>
                    <div>
                        <h3>Job Management</h3>
                        <p className={styles.subtleText}>Oversee active listings and streamline the talent acquisition pipeline.</p>
                    </div>
                    <button className={styles.button} type="button" onClick={onOpenUpload}>Post New Job</button>
                </div>
                <div className={styles.dashboardSummaryGrid}>
                    <span><small>Total openings</small><strong>{managedRecruiterJobs.length}</strong></span>
                    <span><small>Active listings</small><strong>{activeCount}</strong></span>
                    <span><small>Drafts</small><strong>{draftCount}</strong></span>
                    <span><small>Archived</small><strong>{archivedCount}</strong></span>
                    <span className={styles.dashboardSummaryCompact}><small>Total CVs</small><strong>{recruiterCvLogs.length}</strong></span>
                </div>
            </section>

            <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.panelTitleRow}>
                    <div>
                        <h3>Choose JD For Screening</h3>
                        <p className={styles.subtleText}>Select, filter, add, turn off, or delete a job before viewing submitted CVs.</p>
                    </div>
                    <div className={styles.actionConfirmBox}>
                        <button className={jobStatusFilter === "all" ? styles.rangeButton : styles.clearFilterBtn} type="button" onClick={() => setJobStatusFilter("all")}>All</button>
                        <button className={jobStatusFilter === "active" ? styles.rangeButton : styles.clearFilterBtn} type="button" onClick={() => setJobStatusFilter("active")}>Active</button>
                        <button className={jobStatusFilter === "draft" ? styles.rangeButton : styles.clearFilterBtn} type="button" onClick={() => setJobStatusFilter("draft")}>Drafts</button>
                        <button className={jobStatusFilter === "archived" ? styles.rangeButton : styles.clearFilterBtn} type="button" onClick={() => setJobStatusFilter("archived")}>Archived</button>
                    </div>
                </div>

                <form className={styles.screeningFilters} onSubmit={submitSearch}>
                    <input
                        className={styles.filterInput}
                        type="search"
                        placeholder="Enter job title and press Enter to search"
                        value={jdSearchInput}
                        onChange={(e) => setJdSearchInput(e.target.value)}
                    />
                    <button className={styles.clearFilterBtn} type="submit">Search</button>
                    <button className={styles.clearFilterBtn} type="button" onClick={() => { setJdSearchInput(""); setJdSearchTerm(""); setJobPage(1); }}>Clear</button>
                </form>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>JD</th>
                                <th>Company</th>
                                <th>Level</th>
                                <th>Location</th>
                                <th>Salary</th>
                                <th>Status</th>
                                <th>CVs</th>
                                <th>Scored</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    cvLogs={recruiterCvLogs}
                                    jobStatus={getManagedJobStatus(job.id)}
                                    onClick={() => onSelectJob(job.id)}
                                    onTurnOff={() => onTurnOff(job.id)}
                                    onRestore={() => onRestore(job.id)}
                                    onDelete={() => onDelete(job.id, job.title)}
                                />
                            ))}
                            {paginatedJobs.length === 0 && (
                                <tr><td colSpan={9}>No jobs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.paginationRow}>
                    <button
                        className={styles.clearFilterBtn}
                        type="button"
                        disabled={jobPage <= 1}
                        onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                    >
                        Previous page
                    </button>
                    <span>Page {jobPage} / {totalPages}</span>
                    <button
                        className={styles.clearFilterBtn}
                        type="button"
                        disabled={jobPage >= totalPages}
                        onClick={() => setJobPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next page
                    </button>
                </div>
            </section>

            {/* Scoring Summary Popup */}
            {isScoringSummaryOpen && selectedJob && screeningSummary && (
                <div className={styles.popupOverlay}>
                    <div className={`${styles.popupCard} ${styles.summaryPopupCard}`}>
                        <button className={styles.popupClose} type="button" onClick={onCloseSummary}>×</button>
                        <div className={styles.popupHeader}>
                            <h3>{selectedJob.title}</h3>
                            <p>{selectedJob.company_name} · {selectedJob.level} · {selectedJob.location}</p>
                        </div>
                        <article className={styles.summaryJobCard}>
                            <div className={styles.summaryMetricGrid}>
                                <span>Submitted CVs<strong>{screeningSummary.total}</strong></span>
                                <span>Passed<strong>{screeningSummary.passed}</strong></span>
                                <span>Failed<strong>{screeningSummary.failed}</strong></span>
                                <span>Borderline<strong>{screeningSummary.borderline}</strong></span>
                                <span>Highest score<strong>{formatScore(screeningSummary.highestScore)}</strong></span>
                                <span>Lowest score<strong>{formatScore(screeningSummary.lowestScore)}</strong></span>
                                <span>Average score<strong>{formatScore(screeningSummary.averageScore)}</strong></span>
                            </div>
                        </article>
                    </div>
                </div>
            )}

        </>
    );
}
