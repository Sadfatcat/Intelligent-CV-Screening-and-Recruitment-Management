"use client";

import { useMemo } from "react";
import CVLogItemRow from "../components/CVLogItem";
import { useCVFilters } from "../hooks/useCVFilters";
import type { CVLogItem, ExperienceFilter, ScoreStatus } from "../types/recruiterTypes";
import { normalizeScore } from "../utils/cvScoringUtils";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    submittedCvLogs: CVLogItem[];
    isScreeningLoading: boolean;
    screeningError: string;
    onSelectLog: (log: CVLogItem) => void;
    onBackToJobs: () => void;
};

export default function SubmittedCVsPage({
    submittedCvLogs,
    isScreeningLoading,
    screeningError,
    onSelectLog,
    onBackToJobs,
}: Props) {
    const summary = useMemo(() => {
        const scores = submittedCvLogs.map((log) => normalizeScore(log.ai_matching_score)).filter((value): value is number => value !== null);
        const passed = scores.filter((score) => score >= 85).length;
        return {
            total: submittedCvLogs.length,
            average: scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : "-",
            passedRate: submittedCvLogs.length ? `${((passed / submittedCvLogs.length) * 100).toFixed(1)}%` : "0.0%",
            pending: submittedCvLogs.filter((log) => log.status === "pending").length,
        };
    }, [submittedCvLogs]);

    const {
        scoreStatusFilter,
        setScoreStatusFilter,
        scoreRangeFilter,
        setScoreRangeFilter,
        experienceFilter,
        setExperienceFilter,
        screeningSearch,
        setScreeningSearch,
        setCvSortMode,
        sortedFilteredLogs,
        clearFilters,
    } = useCVFilters(submittedCvLogs);

    return (
        <>
        <section className={`${styles.card} ${styles.panelCard} ${styles.dashboardSummaryPanel}`}>
            <div className={styles.panelTitleRow}>
                <div>
                    <h3>Submitted CVs</h3>
                    <p className={styles.subtleText}>Analyze and manage candidate applications across all active job roles.</p>
                </div>
                <div className={styles.actionConfirmBox}>
                    <button className={styles.clearFilterBtn} type="button" onClick={clearFilters}>Filters</button>
                    <button className={styles.button} type="button">Export Data</button>
                </div>
            </div>
            <div className={styles.dashboardSummaryGrid}>
                <span><small>Total submissions</small><strong>{summary.total}</strong></span>
                <span><small>Avg. match score</small><strong>{summary.average}</strong></span>
                <span><small>Passed rate</small><strong>{summary.passedRate}</strong></span>
                <span><small>Pending review</small><strong>{summary.pending}</strong></span>
                <span className={styles.dashboardSummaryCompact}><small>Visible rows</small><strong>{sortedFilteredLogs.length}</strong></span>
            </div>
        </section>

        <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
            <div className={styles.panelTitleRow}>
                <div>
                    <h3>Submitted CVs</h3>
                    <p className={styles.subtleText}>
                        Listing submitted CVs from every JD. Click a row to open the focused scoring view.
                    </p>
                </div>
                <div className={styles.actionConfirmBox}>
                    <button className={styles.clearFilterBtn} type="button" onClick={onBackToJobs}>
                        Back to Job Management
                    </button>
                    <button className={styles.clearFilterBtn} type="button" onClick={clearFilters}>
                        Clear CV filters
                    </button>
                </div>
            </div>

            <div className={styles.screeningFilters}>
                <input
                    className={styles.filterInput}
                    type="search"
                    placeholder="Search candidate, email, skill..."
                    value={screeningSearch}
                    onChange={(e) => setScreeningSearch(e.target.value)}
                />
                <select
                    className={styles.filterSelect}
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value as ExperienceFilter)}
                >
                    <option value="all">All experience</option>
                    <option value="intern">Intern / &lt;1 year</option>
                    <option value="gt1">&gt;1 year</option>
                    <option value="gt3">&gt;3 years</option>
                    <option value="gt5">&gt;5 years</option>
                    <option value="gt7">&gt;7 years</option>
                </select>
                <select
                    className={styles.filterSelect}
                    value={scoreStatusFilter}
                    onChange={(e) => setScoreStatusFilter(e.target.value as ScoreStatus | "all")}
                >
                    <option value="all">All statuses</option>
                    <option value="passed">Passed</option>
                    <option value="borderline">Borderline</option>
                    <option value="failed">Failed</option>
                    <option value="not_scored">Not scored</option>
                </select>
                <select
                    className={styles.filterSelect}
                    value={scoreRangeFilter}
                    onChange={(e) => setScoreRangeFilter(e.target.value as "all" | "85-100" | "50-84" | "0-49")}
                >
                    <option value="all">All score ranges</option>
                    <option value="85-100">85-100</option>
                    <option value="50-84">50-84</option>
                    <option value="0-49">0-49</option>
                </select>
                <button className={styles.clearFilterBtn} type="button" onClick={() => setCvSortMode("experience")}>
                    Sort by experience
                </button>
            </div>

            {isScreeningLoading && <p className={styles.tableState}>Loading CV screening results...</p>}
            {screeningError && <p className={`${styles.tableState} ${styles.error}`}>{screeningError}</p>}

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Candidate</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Job</th>
                            <th>Experience</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Missing</th>
                            <th>Applied</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFilteredLogs.map((log, index) => (
                            <CVLogItemRow
                                key={log.log_id}
                                log={log}
                                rank={index + 1}
                                onClick={() => onSelectLog(log)}
                            />
                        ))}
                        {!isScreeningLoading && sortedFilteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={10}>
                                    {submittedCvLogs.length === 0
                                        ? "No CVs have been submitted yet."
                                        : "No CV matches this filter."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
        </>
    );
}
