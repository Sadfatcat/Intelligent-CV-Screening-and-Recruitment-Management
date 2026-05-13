"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../app/recruiter_UI/page.module.css";
import { RecruiterSidebar } from "./components/RecruiterSidebar";
import { RecruiterStatCard } from "./components/RecruiterStatCard";
import { RecruiterToast } from "./components/RecruiterToast";
import { JOB_MANAGEMENT_STORAGE_KEY, RECRUITER_SESSION_STORAGE_KEY } from "./constants/recruiterConstants";
import {
    deleteApplication,
    fetchJobApplications,
    fetchRecruiterCvLogs,
    fetchRecruiterJobs,
    fetchRecruiterProfile,
    getRecruiterCvFileUrl,
    uploadJobDescription,
} from "./services/recruiterApi";
import type { CVLogItem, CvSortMode, ExperienceFilter, JobApplication, JobManagementStatus, RecruiterJob, RecruiterSession, ScoreStatus, ScoringSubTab } from "./types/recruiterTypes";
import {
    calculateSummary,
    filterCvsByExperience,
    filterCvsByStatus,
    getJobManagementLabel,
    getRecommendationLabel,
    getRenderableMatchingSections,
    getScoreStatus,
    getScoreStatusLabel,
    getSectionPoints,
    getSectionScore,
    normalizeScore,
    sortCvLogs,
} from "./utils/cvScoringUtils";
import { formatLogTime, formatScore } from "./utils/recruiterFormatters";
import { isFptSession, MOCK_FPT_CV_LOGS, MOCK_RECRUITER_JOBS, readStoredFptMockCvLogs } from "./utils/recruiterMockMappers";

function getScoreStatusClass(status: ScoreStatus) {
    const classes: Record<ScoreStatus, string> = {
        passed: styles.statusPassed,
        borderline: styles.statusBorderline,
        failed: styles.statusFailed,
        not_scored: styles.statusNotScored,
    };
    return classes[status];
}

function getJobManagementClass(status: JobManagementStatus) {
    const classes: Record<JobManagementStatus, string> = {
        active: styles.jobStatusActive,
        turned_off: styles.jobStatusTurnedOff,
        deleted: styles.jobStatusDeleted,
    };
    return classes[status];
}

export default function RecruiterUIPage() {
    const router = useRouter();
    const [session, setSession] = useState<RecruiterSession | null>(null);
    const [isSessionChecked, setIsSessionChecked] = useState(false);

    const [title, setTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [location, setLocation] = useState("");
    const [level, setLevel] = useState("Junior");
    const [deadline, setDeadline] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [directContact, setDirectContact] = useState("");
    const [description, setDescription] = useState("");
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    const [jobs, setJobs] = useState<RecruiterJob[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [cvLogs, setCvLogs] = useState<CVLogItem[]>([]);
    const [deleteConfirmApplicationId, setDeleteConfirmApplicationId] = useState<number | null>(null);
    const [selectedLog, setSelectedLog] = useState<CVLogItem | null>(null);
    const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
    const [scoreStatusFilter, setScoreStatusFilter] = useState<ScoreStatus | "all">("all");
    const [scoreRangeFilter, setScoreRangeFilter] = useState<"all" | "85-100" | "50-84" | "0-49">("all");
    const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>("all");
    const [screeningSearch, setScreeningSearch] = useState("");
    const [isScreeningLoading, setIsScreeningLoading] = useState(false);
    const [screeningError, setScreeningError] = useState("");
    const [activeWorkspace, setActiveWorkspace] = useState<"overview" | "scoring">("overview");
    const [scoringSubTab, setScoringSubTab] = useState<ScoringSubTab>("jobs");
    const [jdSearchInput, setJdSearchInput] = useState("");
    const [jdSearchTerm, setJdSearchTerm] = useState("");
    const [jobPage, setJobPage] = useState(1);
    const [selectedScreeningLog, setSelectedScreeningLog] = useState<CVLogItem | null>(null);
    const [cvSortMode, setCvSortMode] = useState<CvSortMode>("score");
    const [jobManagementState, setJobManagementState] = useState<Record<number, JobManagementStatus>>({});
    const [storedFptCvLogs, setStoredFptCvLogs] = useState<CVLogItem[]>([]);
    const [isScoringSummaryOpen, setIsScoringSummaryOpen] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const isFptRecruiter = isFptSession(session, companyName);
    const recruiterJobs = useMemo(
        () => (isFptRecruiter ? [...jobs, ...MOCK_RECRUITER_JOBS] : jobs),
        [isFptRecruiter, jobs]
    );
    const recruiterCvLogs = useMemo(
        () => (isFptRecruiter ? [...cvLogs, ...storedFptCvLogs, ...MOCK_FPT_CV_LOGS] : cvLogs),
        [cvLogs, isFptRecruiter, storedFptCvLogs]
    );
    const managedRecruiterJobs = useMemo(
        () => recruiterJobs
            .filter((job) => getManagedJobStatus(job.id) !== "deleted")
            .sort((a, b) => {
                const aInactive = getManagedJobStatus(a.id) === "turned_off" ? 1 : 0;
                const bInactive = getManagedJobStatus(b.id) === "turned_off" ? 1 : 0;
                return aInactive - bInactive;
            }),
        [jobManagementState, recruiterJobs]
    );

    useEffect(() => {
        const saved = localStorage.getItem(RECRUITER_SESSION_STORAGE_KEY);
        const savedJobState = localStorage.getItem(JOB_MANAGEMENT_STORAGE_KEY);
        if (savedJobState) {
            try {
                const parsed = JSON.parse(savedJobState) as Record<string, string>;
                const normalized = Object.fromEntries(
                    Object.entries(parsed)
                        .filter(([, value]) => value === "active" || value === "turned_off" || value === "deleted" || value === "deleted_active")
                        .map(([key, value]) => [Number(key), value === "deleted_active" ? "deleted" : value])
                ) as Record<number, JobManagementStatus>;
                setJobManagementState(normalized);
            } catch {
                localStorage.removeItem(JOB_MANAGEMENT_STORAGE_KEY);
            }
        }
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as RecruiterSession;
                if (parsed.role === "recruiter" && !parsed.must_change_password) {
                    setSession(parsed);
                }
            } catch {
                localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
            }
        }
        setIsSessionChecked(true);
    }, []);

    useEffect(() => {
        if (isSessionChecked && !session) {
            router.replace("/recruiter/login");
        }
    }, [isSessionChecked, router, session]);

    useEffect(() => {
        if (!message) return;
        const timer = window.setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 4200);
        return () => window.clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        function syncStoredFptLogs() {
            setStoredFptCvLogs(readStoredFptMockCvLogs());
        }
        syncStoredFptLogs();
        window.addEventListener("storage", syncStoredFptLogs);
        return () => window.removeEventListener("storage", syncStoredFptLogs);
    }, []);

    async function loadRecruiterJobs(recruiterId: number) {
        setJobs(await fetchRecruiterJobs(recruiterId));
    }

    async function reloadRecruiterData(recruiterId: number, keepCurrentSelection = true) {
        await loadRecruiterJobs(recruiterId);

        setIsScreeningLoading(true);
        setScreeningError("");
        try {
            setCvLogs(await fetchRecruiterCvLogs(recruiterId));
        } catch (err) {
            setIsScreeningLoading(false);
            setScreeningError(err instanceof Error ? err.message : "Failed to load CV logs");
            throw err;
        } finally {
            setIsScreeningLoading(false);
        }

        if (keepCurrentSelection && selectedJobId) {
            setApplications(await fetchJobApplications(recruiterId, selectedJobId));
        }
    }

    useEffect(() => {
        if (!session) return;

        fetchRecruiterProfile(session.user_id)
            .then((data) => {
                const accountCompany = typeof data.company_name === "string" ? data.company_name : "";
                setCompanyName(accountCompany);

                const mergedSession: RecruiterSession = {
                    ...session,
                    email: data.email || session.email,
                    company_name: accountCompany || session.company_name,
                };
                const hasChanged =
                    mergedSession.email !== session.email ||
                    mergedSession.company_name !== session.company_name;

                if (hasChanged) {
                    setSession(mergedSession);
                    localStorage.setItem(RECRUITER_SESSION_STORAGE_KEY, JSON.stringify(mergedSession));
                }
            })
            .catch(() => {
                setCompanyName(session.company_name || "");
            });

        loadRecruiterJobs(session.user_id).catch((err) => {
            setMessage(err instanceof Error ? err.message : "Failed to load jobs");
            setMessageType("error");
        });

        setIsScreeningLoading(true);
        setScreeningError("");
        fetchRecruiterCvLogs(session.user_id)
            .then((data) => {
                setCvLogs(data);
                setScreeningError("");
            })
            .catch((err) => {
                setCvLogs([]);
                setScreeningError(err instanceof Error ? err.message : "Failed to load CV logs");
                setMessage(err instanceof Error ? err.message : "Failed to load CV logs");
                setMessageType("error");
            })
            .finally(() => {
                setIsScreeningLoading(false);
            });
    }, [session]);

    useEffect(() => {
        if (!session || !selectedJobId) {
            setApplications([]);
            return;
        }
        if (isFptRecruiter && MOCK_RECRUITER_JOBS.some((job) => job.id === selectedJobId)) {
            setApplications([]);
            return;
        }

        fetchJobApplications(session.user_id, selectedJobId)
            .then(setApplications)
            .catch((err) => {
                setMessage(err instanceof Error ? err.message : "Failed to load applications");
                setMessageType("error");
            });
    }, [isFptRecruiter, session, selectedJobId]);

    function handleLogout() {
        localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
        localStorage.removeItem("currentUser");
        setSession(null);
        setSelectedJobId(null);
        setApplications([]);
        setCvLogs([]);
        setIsUploadPopupOpen(false);
        setMessage("Logged out");
        setMessageType("success");
        router.push("/recruiter/login");
    }

    function getManagedJobStatus(jobId: number): JobManagementStatus {
        return jobManagementState[jobId] || "active";
    }

    function setManagedJobStatus(jobId: number, status: JobManagementStatus) {
        setJobManagementState((current) => {
            const next = { ...current, [jobId]: status };
            if (status === "active") {
                delete next[jobId];
            }
            localStorage.setItem(JOB_MANAGEMENT_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }

    function handleTurnOffJob(jobId: number) {
        setManagedJobStatus(jobId, "turned_off");
        setMessage("Job turned off. It is hidden from the public recruitment page, but submitted CVs remain accessible.");
        setMessageType("success");
    }

    function handleRestoreJob(jobId: number) {
        setManagedJobStatus(jobId, "active");
        setMessage("Job restored to the active list.");
        setMessageType("success");
    }

    async function handleUploadJD(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!session) return;
        if (!jdFile) {
            setMessage("Please choose a JD PDF file");
            setMessageType("error");
            return;
        }

        try {
            await uploadJobDescription({
                recruiterId: session.user_id,
                title,
                location,
                level,
                deadline,
                quantity,
                directContact,
                description,
                jdFile,
                coverImageFile,
            });

            setMessage("JD uploaded successfully. Job card created.");
            setMessageType("success");
            setTitle("");
            setCompanyName(session.company_name || "");
            setLocation("");
            setLevel("Junior");
            setDeadline("");
            setQuantity(1);
            setDirectContact("");
            setDescription("");
            setJdFile(null);
            setCoverImageFile(null);
            setIsUploadPopupOpen(false);

            await loadRecruiterJobs(session.user_id);
            setCvLogs(await fetchRecruiterCvLogs(session.user_id));
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Upload JD failed");
            setMessageType("error");
        }
    }

    function handleDeleteJob(jobId: number, jobTitle?: string) {
        const label = jobTitle?.trim() || "this job";
        if (!window.confirm(`Delete "${label}" from job management? Submitted CV history will be preserved.`)) return;
        setManagedJobStatus(jobId, "deleted");
        if (selectedJobId === jobId) {
            setSelectedJobId(null);
            setApplications([]);
        }
        setMessage("Job deleted from management. Submitted CV history is still kept in CV results.");
        setMessageType("success");
    }

    async function handleDeleteApplication(applicationId: number) {
        if (!session) return;
        try {
            await deleteApplication(session.user_id, applicationId);

            setDeleteConfirmApplicationId(null);
            setMessage("CV deleted successfully");
            setMessageType("success");

            if (selectedLog?.application_id === applicationId) {
                setSelectedLog(null);
            }

            await reloadRecruiterData(session.user_id);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Delete CV failed");
            setMessageType("error");
        }
    }

    const selectedJob = useMemo(
        () => recruiterJobs.find((job) => job.id === selectedJobId) || null,
        [recruiterJobs, selectedJobId]
    );

    const jobScopedLogs = useMemo(() => {
        if (!selectedJobId) return recruiterCvLogs;
        return recruiterCvLogs.filter((log) => log.job_id === selectedJobId);
    }, [recruiterCvLogs, selectedJobId]);

    const submittedCvLogs = recruiterCvLogs;

    const screeningSummary = useMemo(
        () => calculateSummary(jobScopedLogs),
        [jobScopedLogs]
    );

    const filteredLogs = useMemo(() => {
        const q = screeningSearch.trim().toLowerCase();
        return filterCvsByExperience(filterCvsByStatus(submittedCvLogs, scoreStatusFilter), experienceFilter)
            .filter((log) => {
                const score = normalizeScore(log.ai_matching_score);
                if (scoreRangeFilter === "85-100" && (score === null || score < 85)) return false;
                if (scoreRangeFilter === "50-84" && (score === null || score < 50 || score >= 85)) return false;
                if (scoreRangeFilter === "0-49" && (score === null || score >= 50)) return false;

                if (!q) return true;
                const haystack = [
                    log.candidate_email,
                    log.candidate_phone,
                    log.job_title,
                    ...(log.matching_detail?.good_points || []),
                    ...(log.matching_detail?.missing_points || []),
                    ...getSectionPoints(log.matching_detail, ["technical_skills", "programming_languages"], "good"),
                    ...getSectionPoints(log.matching_detail, ["technical_skills", "programming_languages"], "missing"),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(q);
            });
    }, [experienceFilter, scoreRangeFilter, scoreStatusFilter, screeningSearch, submittedCvLogs]);

    const sortedFilteredLogs = useMemo(() => {
        return sortCvLogs(filteredLogs, cvSortMode);
    }, [cvSortMode, filteredLogs]);

    const filteredScreeningJobs = useMemo(() => {
        const q = jdSearchTerm.trim().toLowerCase();
        if (!q) return managedRecruiterJobs;
        return managedRecruiterJobs.filter((job) => {
            return [job.title, job.company_name, job.location, job.level]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q);
        });
    }, [jdSearchTerm, managedRecruiterJobs]);

    const paginatedScreeningJobs = useMemo(() => {
        const startIndex = (jobPage - 1) * 5;
        return filteredScreeningJobs.slice(startIndex, startIndex + 5);
    }, [filteredScreeningJobs, jobPage]);

    const jobTotalPages = Math.max(1, Math.ceil(filteredScreeningJobs.length / 5));

    const companyLabel = useMemo(() => {
        const fromSession = session?.company_name;
        if (fromSession && fromSession.trim()) return fromSession;
        const fromSelected = selectedJob?.company_name;
        if (fromSelected && fromSelected.trim()) return fromSelected;
        const fromJob = recruiterJobs[0]?.company_name;
        if (fromJob && fromJob.trim()) return fromJob;
        const fromEmail = session?.email;
        if (fromEmail && fromEmail.includes("@")) return fromEmail.split("@")[0];
        return "Recruiter";
    }, [recruiterJobs, selectedJob, session]);

    const displayedApplications = useMemo(() => {
        if (selectedJob?.isMock) {
            return jobScopedLogs.map((log) => ({
                application_id: log.application_id,
                cv_id: log.cv_id,
                candidate_name: log.candidate_name,
                candidate_email: log.candidate_email,
                candidate_phone: log.candidate_phone,
                status: log.status,
                ai_matching_score: log.ai_matching_score,
                matching_detail: log.matching_detail,
            }));
        }
        return applications;
    }, [applications, jobScopedLogs, selectedJob]);

    const activeDetailLog = selectedScreeningLog || selectedLog;
    const selectedMatchingDetail = activeDetailLog?.matching_detail || null;
    const renderableMatchingSections = getRenderableMatchingSections(selectedMatchingDetail);
    const selectedMustHave = selectedMatchingDetail?.must_have || null;
    const selectedScoreStatus = getScoreStatus(activeDetailLog?.ai_matching_score);
    const selectedRecommendation = getRecommendationLabel(activeDetailLog?.ai_matching_score);
    const selectedMatchedSkills = getSectionPoints(
        selectedMatchingDetail,
        ["technical_skills", "programming_languages"],
        "good"
    );
    const selectedMissingSkills = getSectionPoints(
        selectedMatchingDetail,
        ["technical_skills", "programming_languages"],
        "missing"
    );
    const selectedRelevantProjects = getSectionPoints(selectedMatchingDetail, ["projects"], "good");
    const selectedExperienceGood = getSectionPoints(selectedMatchingDetail, ["experience"], "good");
    const selectedMissingRequirements = [
        ...getSectionPoints(selectedMatchingDetail, ["experience", "responsibilities", "projects"], "missing"),
        ...(selectedMustHave?.missing || []),
    ];

    function clearScreeningFilters() {
        setScoreStatusFilter("all");
        setScoreRangeFilter("all");
        setExperienceFilter("all");
        setScreeningSearch("");
        setCvSortMode("score");
    }

    function selectScreeningJob(jobId: number) {
        setSelectedJobId(jobId);
        setSelectedScreeningLog(null);
        setSelectedLog(null);
        setIsScoringSummaryOpen(true);
    }

    function submitJobSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const nextTerm = jdSearchInput.trim();
        const matches = recruiterJobs.filter((job) => job.title.toLowerCase().includes(nextTerm.toLowerCase()));
        setJdSearchTerm(nextTerm);
        setJobPage(1);
        setSelectedScreeningLog(null);
        if (nextTerm && matches.length === 1) {
            selectScreeningJob(matches[0].id);
        } else {
            setScoringSubTab("jobs");
        }
    }

    function clearJobSearch() {
        setJdSearchInput("");
        setJdSearchTerm("");
        setJobPage(1);
    }

    useEffect(() => {
        setJobPage(1);
    }, [jdSearchTerm, recruiterJobs]);

    if (!session) {
        return <div className={styles.page} />;
    }

    return (
        <div className={styles.dashboardContainer}>
            <RecruiterSidebar
                companyLabel={companyLabel}
                email={session.email}
                activeWorkspace={activeWorkspace}
                onOpenDashboard={() => {
                    setActiveWorkspace("overview");
                    setSelectedScreeningLog(null);
                    setScoringSubTab("jobs");
                }}
                onOpenScoring={() => {
                    setActiveWorkspace("scoring");
                    setSelectedLog(null);
                    setSelectedScreeningLog(null);
                    setScoringSubTab("jobs");
                    setIsScoringSummaryOpen(false);
                }}
                onOpenUpload={() => setIsUploadPopupOpen(true)}
                onLogout={handleLogout}
            />

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>{activeWorkspace === "scoring" ? "CV Scoring Workspace" : "Recruiter Dashboard"}</h1>
                    <p>
                        {activeWorkspace === "scoring"
                            ? "Choose one JD first, then review submitted CV scores in smaller focused steps."
                            : "Manage JD posts and track CV submissions in real time."}
                    </p>
                </header>

                <main className={styles.contentArea}>
                    <RecruiterToast message={message} type={messageType} />
                    {activeWorkspace === "scoring" ? (
                        <>
                            <nav className={styles.subTabs} aria-label="CV scoring steps">
                                <button
                                    className={`${styles.subTabButton} ${scoringSubTab === "jobs" ? styles.subTabButtonActive : ""}`}
                                    type="button"
                                    onClick={() => {
                                        setScoringSubTab("jobs");
                                        setSelectedScreeningLog(null);
                                    }}
                                >
                                    Job List
                                </button>
                                <button
                                    className={`${styles.subTabButton} ${scoringSubTab === "cvs" ? styles.subTabButtonActive : ""}`}
                                    type="button"
                                    onClick={() => {
                                        setScoringSubTab("cvs");
                                        setSelectedScreeningLog(null);
                                    }}
                                >
                                    Submitted CVs
                                </button>
                                <button
                                    className={`${styles.subTabButton} ${scoringSubTab === "detail" ? styles.subTabButtonActive : ""}`}
                                    type="button"
                                    onClick={() => setScoringSubTab("detail")}
                                >
                                    CV Detail
                                </button>
                            </nav>

                            {/* Job List: chọn JD trước khi xem CV. */}
                            {scoringSubTab === "jobs" && (
                            <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                                <div className={styles.panelTitleRow}>
                                    <div>
                                        <h3>Choose JD For Screening</h3>
                                        <p className={styles.subtleText}>Select, filter, add, turn off, or delete a job before viewing submitted CVs.</p>
                                    </div>
                                    <button className={styles.button} type="button" onClick={() => setIsUploadPopupOpen(true)}>
                                        Add JD
                                    </button>
                                </div>

                                <form className={styles.screeningFilters} onSubmit={submitJobSearch}>
                                    <input
                                        className={styles.filterInput}
                                        type="search"
                                        placeholder="Enter job title and press Enter to search"
                                        value={jdSearchInput}
                                        onChange={(e) => setJdSearchInput(e.target.value)}
                                    />
                                    <button className={styles.clearFilterBtn} type="submit">
                                        Search
                                    </button>
                                    <button className={styles.clearFilterBtn} type="button" onClick={clearJobSearch}>
                                        Clear
                                    </button>
                                </form>

                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>JD</th>
                                                <th>Company</th>
                                                <th>Level</th>
                                                <th>Location</th>
                                                <th>Status</th>
                                                <th>CVs</th>
                                                <th>Scored</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedScreeningJobs.map((job) => {
                                                const jobLogs = recruiterCvLogs.filter((log) => log.job_id === job.id);
                                                const scoredCount = jobLogs.filter((log) => normalizeScore(log.ai_matching_score) !== null).length;
                                                const jobStatus = getManagedJobStatus(job.id);
                                                return (
                                                    <tr
                                                        key={job.id}
                                                        className={`${styles.clickableRow} ${jobStatus === "turned_off" ? styles.tableInactiveRow : ""}`}
                                                        onClick={() => selectScreeningJob(job.id)}
                                                    >
                                                        <td>{job.title} {job.isMock && <span className={styles.mockBadge}>Mock</span>}</td>
                                                        <td>{job.company_name}</td>
                                                        <td>{job.level}</td>
                                                        <td>{job.location}</td>
                                                        <td>
                                                            <span className={`${styles.jobStatusPill} ${getJobManagementClass(jobStatus)}`}>
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
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            handleTurnOffJob(job.id);
                                                                        }}
                                                                    >
                                                                        Turn Off
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className={styles.restoreJobBtn}
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            handleRestoreJob(job.id);
                                                                        }}
                                                                    >
                                                                        Restore
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className={styles.deleteCvBtn}
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        handleDeleteJob(job.id, job.title);
                                                                    }}
                                                                >
                                                                    Delete Job
                                                                </button>
                                                                {job.isMock && <span className={styles.mockBadge}>Mock</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {paginatedScreeningJobs.length === 0 && (
                                                <tr>
                                                    <td colSpan={8}>
                                                        {jdSearchTerm ? "No matching job found." : "Empty job list."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className={styles.paginationBar}>
                                    <button
                                        className={styles.clearFilterBtn}
                                        type="button"
                                        disabled={jobPage <= 1}
                                        onClick={() => setJobPage((page) => Math.max(1, page - 1))}
                                    >
                                        Previous page
                                    </button>
                                    <span>Page {jobPage} / {jobTotalPages}</span>
                                    <button
                                        className={styles.clearFilterBtn}
                                        type="button"
                                        disabled={jobPage >= jobTotalPages}
                                        onClick={() => setJobPage((page) => Math.min(jobTotalPages, page + 1))}
                                    >
                                        Next page
                                    </button>
                                </div>
                            </section>
                            )}

                            {/* Submitted CVs: bảng ranking CV của JD đã chọn. */}
                            {scoringSubTab === "cvs" && (
                                <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                                    <div className={styles.panelTitleRow}>
                                        <div>
                                            <h3>Submitted CVs</h3>
                                            <p className={styles.subtleText}>
                                                Listing submitted CVs from every JD. Click a row to open the focused scoring view.
                                            </p>
                                        </div>
                                        <div className={styles.actionConfirmBox}>
                                            <button className={styles.clearFilterBtn} type="button" onClick={() => setScoringSubTab("jobs")}>
                                                Back to Job List
                                            </button>
                                            <button className={styles.clearFilterBtn} type="button" onClick={clearScreeningFilters}>
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
                                                {sortedFilteredLogs.map((log, index) => {
                                                    const status = getScoreStatus(log.ai_matching_score);
                                                    const missing = getSectionPoints(log.matching_detail, ["technical_skills", "programming_languages"], "missing").slice(0, 3);
                                                    return (
                                                        <tr
                                                            key={log.log_id}
                                                            className={styles.clickableRow}
                                                            onClick={() => {
                                                                setSelectedScreeningLog(log);
                                                                setSelectedJobId(log.job_id);
                                                                setSelectedLog(null);
                                                                setScoringSubTab("detail");
                                                            }}
                                                        >
                                                            <td className={styles.tableSoftText}>#{index + 1}</td>
                                                            <td><strong>{log.candidate_name || "-"}</strong></td>
                                                            <td className={styles.tableSoftText}>{log.candidate_email || "-"}</td>
                                                            <td className={styles.tableSoftText}>{log.candidate_phone || "-"}</td>
                                                            <td><strong>{log.job_title || "-"}</strong></td>
                                                            <td><strong>{log.experience_years != null ? `${formatScore(log.experience_years)} yrs` : "-"}</strong></td>
                                                            <td>
                                                                <span className={`${styles.statusBadge} ${getScoreStatusClass(status)}`}>
                                                                    {getScoreStatusLabel(status)}
                                                                </span>
                                                            </td>
                                                            <td><strong>{formatScore(log.ai_matching_score)}/100</strong></td>
                                                            <td className={styles.tableSoftText}>
                                                                <span className={styles.strongMuted}>{missing.length ? missing.join(", ") : "No missing skills"}</span>
                                                            </td>
                                                            <td className={styles.tableSoftText}>{formatLogTime(log.created_at)}</td>
                                                        </tr>
                                                    );
                                                })}
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
                            )}

                            {/* CV Detail: chi tiết điểm và thông tin CV. */}
                            {scoringSubTab === "detail" && (
                                <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                                    {!selectedScreeningLog ? (
                                        <p className={styles.tableState}>Please select a CV to view details.</p>
                                    ) : (
                                        <>
                                    <div className={styles.panelTitleRow}>
                                        <div>
                                            <h3>{selectedScreeningLog.candidate_name || "Unnamed Candidate"}</h3>
                                            <p className={styles.subtleText}>{selectedScreeningLog.job_title} · Application #{selectedScreeningLog.application_id}</p>
                                            <span className={`${styles.jobStatusPill} ${getJobManagementClass(getManagedJobStatus(selectedScreeningLog.job_id))}`}>
                                                {getJobManagementLabel(getManagedJobStatus(selectedScreeningLog.job_id))}
                                            </span>
                                        </div>
                                        <button className={styles.clearFilterBtn} type="button" onClick={() => {
                                            setSelectedScreeningLog(null);
                                            setScoringSubTab("cvs");
                                        }}>
                                            Back to Submitted CVs
                                        </button>
                                    </div>

                                    <div className={styles.kanbanGrid}>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Candidate</p>
                                            <h4>{selectedScreeningLog.candidate_name || "-"}</h4>
                                            <p>{selectedScreeningLog.candidate_email || "No email"}</p>
                                            <p>{selectedScreeningLog.candidate_phone || "No phone"}</p>
                                            <p>{selectedScreeningLog.cv_file_name || "CV file name is not available"}</p>
                                            <p>{selectedScreeningLog.target_position || selectedScreeningLog.job_title}</p>
                                            <p>{formatLogTime(selectedScreeningLog.created_at)}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Profile Summary</p>
                                            <p>{selectedScreeningLog.summary || "Summary is not available from backend yet."}</p>
                                            <p>Experience: {selectedScreeningLog.experience_years ?? "-"} years</p>
                                            <p>Education: {selectedScreeningLog.education || "Not available"}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Skills</p>
                                            <p>{selectedScreeningLog.skills?.length ? selectedScreeningLog.skills.join(", ") : "Skills are not available from backend yet."}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Extra Skills</p>
                                            <p>{selectedScreeningLog.extra_skills?.length ? selectedScreeningLog.extra_skills.join(", ") : "Extra skills are not available."}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Languages</p>
                                            <p>{selectedScreeningLog.languages?.length ? selectedScreeningLog.languages.join(", ") : "Languages are not available from backend yet."}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Certifications</p>
                                            <p>{selectedScreeningLog.certifications?.length ? selectedScreeningLog.certifications.join(", ") : "Certifications are not available."}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Work Experience</p>
                                            <ul className={styles.matchingList}>
                                                {selectedScreeningLog.work_experience?.length ? selectedScreeningLog.work_experience.map((item) => (
                                                    <li key={`work-${item}`}>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>Work experience is not available from backend yet.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Overall</p>
                                            <h4>{formatScore(selectedScreeningLog.ai_matching_score)}/100</h4>
                                            <span className={`${styles.statusBadge} ${getScoreStatusClass(selectedScoreStatus)}`}>
                                                {getScoreStatusLabel(selectedScoreStatus)}
                                            </span>
                                            <p>{selectedRecommendation}</p>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Matched Skills</p>
                                            <ul className={styles.matchingList}>
                                                {selectedMatchedSkills.length ? selectedMatchedSkills.map((item) => (
                                                    <li className={styles.goodPoint} key={`detail-good-${item}`}><span>✓</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>No matched skills recorded.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Missing Skills</p>
                                            <ul className={styles.matchingList}>
                                                {selectedMissingSkills.length ? selectedMissingSkills.map((item) => (
                                                    <li className={styles.missingPoint} key={`detail-missing-${item}`}><span>✕</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>No missing skills recorded.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Experience</p>
                                            <ul className={styles.matchingList}>
                                                {selectedExperienceGood.length ? selectedExperienceGood.map((item) => (
                                                    <li className={styles.goodPoint} key={`detail-exp-${item}`}><span>✓</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>No experience evidence recorded.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Projects</p>
                                            <ul className={styles.matchingList}>
                                                {selectedRelevantProjects.length ? selectedRelevantProjects.map((item) => (
                                                    <li className={styles.goodPoint} key={`detail-project-${item}`}><span>✓</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>No relevant projects recorded.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Missing Requirements</p>
                                            <ul className={styles.matchingList}>
                                                {selectedMissingRequirements.length ? selectedMissingRequirements.map((item) => (
                                                    <li className={styles.missingPoint} key={`detail-req-${item}`}><span>✕</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>No missing requirements recorded.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Section Scores</p>
                                            <div className={styles.scoreBreakdownGrid}>
                                                {renderableMatchingSections.map((section) => (
                                                    <div key={`detail-section-${section.key}`}>
                                                        <span>{section.label || section.key}</span>
                                                        <strong>{formatScore(section.score)}/100</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Reason / Explanation</p>
                                            <p>{selectedMatchingDetail?.sections?.[0]?.explanation || "Reason is not available from backend yet."}</p>
                                        </article>
                                    </div>
                                        </>
                                    )}
                                </section>
                            )}
                        </>
                    ) : (
                        <>
                    {/* Dashboard: hiển thị thống kê tổng quan. */}
                    <RecruiterStatCard label="Total Jobs" value={managedRecruiterJobs.length} tone="neutral" />
                    <RecruiterStatCard label="Total CVs" value={screeningSummary.total} tone="neutral" />
                    <RecruiterStatCard label="Scored CVs" value={screeningSummary.scored} tone="scored" />
                    <RecruiterStatCard label="Passed" value={screeningSummary.passed} tone="passed" />
                    <RecruiterStatCard label="Borderline" value={screeningSummary.borderline} tone="borderline" />
                    <RecruiterStatCard label="Failed" value={screeningSummary.failed} tone="failed" />

                    {/* Job Management: quản lý danh sách JD. */}
                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Manage Uploaded Jobs</h3>
                        <p className={styles.subtleText}>Turn Off keeps the job here for restore. Delete removes it from job management while CV history stays in results.</p>
                        <div className={styles.jobManagementList}>
                            {managedRecruiterJobs.map((job) => {
                                const jobStatus = getManagedJobStatus(job.id);
                                const jobLogs = recruiterCvLogs.filter((log) => log.job_id === job.id);
                                return (
                                    <div
                                        key={job.id}
                                        className={`${styles.jobItemWrap} ${jobStatus === "turned_off" ? styles.jobItemInactive : ""}`}
                                    >
                                        <button
                                            className={`${styles.jobBtn} ${selectedJobId === job.id ? styles.jobBtnActive : ""}`}
                                            onClick={() => {
                                                if (selectedJobId === job.id) {
                                                    setSelectedJobId(null);
                                                    setApplications([]);
                                                } else {
                                                    setSelectedJobId(job.id);
                                                }
                                            }}
                                        >
                                            <span className={styles.jobItemTitle}>{job.title}</span>
                                            <span className={styles.jobItemMeta}>
                                                {job.company_name || "Unknown company"} · {job.level || "No level"} · {jobLogs.length} CVs
                                            </span>
                                        </button>
                                        <div className={styles.jobItemRight}>
                                            <span className={`${styles.jobStatusPill} ${getJobManagementClass(jobStatus)}`}>
                                                {getJobManagementLabel(jobStatus)}
                                            </span>
                                            {job.isMock && <span className={styles.mockBadge}>Mock</span>}
                                            <div className={styles.jobActionGroup}>
                                                {jobStatus === "active" ? (
                                                    <button
                                                        className={styles.turnOffJobBtn}
                                                        type="button"
                                                        onClick={() => handleTurnOffJob(job.id)}
                                                    >
                                                        Turn Off
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={styles.restoreJobBtn}
                                                        type="button"
                                                        onClick={() => handleRestoreJob(job.id)}
                                                    >
                                                        Restore
                                                    </button>
                                                )}
                                                <button
                                                    className={styles.jobDeleteXBtn}
                                                    onClick={() => handleDeleteJob(job.id, job.title)}
                                                    title="Delete this job"
                                                    aria-label={`Delete job ${job.title}`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {managedRecruiterJobs.length === 0 && <p>No JD uploaded yet.</p>}
                        </div>
                    </section>

                    {/* CV Ranking: bảng xếp hạng và filter CV. */}
                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>CV Screening Results</h3>
                                <p className={styles.subtleText}>Ranked by matching score from high to low.</p>
                            </div>
                            <button className={styles.clearFilterBtn} type="button" onClick={clearScreeningFilters}>
                                Clear filters
                            </button>
                        </div>

                        <div className={styles.screeningFilters}>
                            <input
                                className={styles.filterInput}
                                type="search"
                                placeholder="Search candidate, email, job, skill..."
                                value={screeningSearch}
                                onChange={(e) => setScreeningSearch(e.target.value)}
                            />
                            <select
                                className={styles.filterSelect}
                                value={scoreStatusFilter}
                                onChange={(e) => setScoreStatusFilter(e.target.value as ScoreStatus | "all")}
                            >
                                <option value="all">All statuses</option>
                                <option value="passed">Passed</option>
                                <option value="borderline">Borderline</option>
                                <option value="failed">Failed</option>
                                <option value="not_scored">Not scored / Pending</option>
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
                        </div>

                        {isScreeningLoading && (
                            <p className={styles.tableState}>Loading CV screening results...</p>
                        )}
                        {screeningError && (
                            <p className={`${styles.tableState} ${styles.error}`}>{screeningError}</p>
                        )}
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Time</th>
                                        <th>Job</th>
                                        <th>Candidate</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th>Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFilteredLogs.map((log, index) => {
                                        const status = getScoreStatus(log.ai_matching_score);
                                        return (
                                            <tr key={log.log_id}>
                                                <td className={styles.tableSoftText}>#{index + 1}</td>
                                                <td className={styles.tableSoftText}>{formatLogTime(log.created_at)}</td>
                                                <td>{log.job_title}</td>
                                                <td>{log.candidate_name || "-"}</td>
                                                <td className={styles.tableSoftText}>{log.candidate_email || "-"}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${getScoreStatusClass(status)}`}>
                                                        {getScoreStatusLabel(status)}
                                                    </span>
                                                </td>
                                                <td>{formatScore(log.ai_matching_score)}/100</td>
                                                <td className={styles.tableSoftText}>{getRecommendationLabel(log.ai_matching_score)}</td>
                                            </tr>
                                        );
                                    })}
                                    {!isScreeningLoading && sortedFilteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={8}>
                                                {jobScopedLogs.length === 0
                                                    ? "No CV uploads logged yet."
                                                    : "No CV matches the current filters."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Application Status: quản lý CV đã nộp theo JD đang chọn. */}
                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Application Status (Selected Job)</h3>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedApplications.map((app) => (
                                        <tr key={app.application_id}>
                                            <td>{app.candidate_name || "-"}</td>
                                            <td>{app.candidate_email || "-"}</td>
                                            <td>{app.candidate_phone || "-"}</td>
                                            <td>{app.status}</td>
                                            <td>{formatScore(app.ai_matching_score)}</td>
                                            <td>
                                                {selectedJob?.isMock ? (
                                                    <span className={styles.mockBadge}>Mock data</span>
                                                ) : deleteConfirmApplicationId === app.application_id ? (
                                                    <div className={styles.actionConfirmBox}>
                                                        <button
                                                            className={styles.confirmDeleteBtn}
                                                            onClick={() => handleDeleteApplication(app.application_id)}
                                                            type="button"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            className={styles.cancelDeleteBtn}
                                                            onClick={() => setDeleteConfirmApplicationId(null)}
                                                            type="button"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className={styles.deleteCvBtn}
                                                        onClick={() => setDeleteConfirmApplicationId(app.application_id)}
                                                        type="button"
                                                    >
                                                        Delete CV
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {displayedApplications.length === 0 && (
                                        <tr>
                                            <td colSpan={6}>No applications for selected job yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                        </>
                    )}

                </main>
            </div>

            {/* CV Scoring Summary Popup: xem nhanh tình trạng CV theo từng JD. */}
            {isScoringSummaryOpen && activeWorkspace === "scoring" && selectedJob && (
                <div className={styles.popupOverlay}>
                    <div className={`${styles.popupCard} ${styles.summaryPopupCard}`}>
                        <button className={styles.popupClose} onClick={() => setIsScoringSummaryOpen(false)}>×</button>
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

            {/* Upload JD Modal: tạo JD và upload file. */}
            {isUploadPopupOpen && (
                <div className={styles.popupOverlay}>
                    <div className={`${styles.popupCard} ${styles.uploadDrawerCard}`}>
                        <button className={styles.popupClose} onClick={() => setIsUploadPopupOpen(false)}>×</button>

                        <div className={styles.popupHeader}>
                            <h3>Create Job Card + Upload JD</h3>
                            <p>Fill in details and upload JD PDF. This style is adapted from candidate CV submit modal.</p>
                        </div>

                        <form onSubmit={handleUploadJD}>
                            <div className={styles.modalBody}>
                                <div className={styles.modalFormCol}>
                                    <input className={styles.modalInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" required />
                                    <input className={styles.modalInput} value={companyName || companyLabel} placeholder="Company name" readOnly />
                                    <input className={styles.modalInput} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Work location" required />
                                    <div className={styles.modalRow}>
                                        <input className={styles.modalInput} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level" required />
                                        <input className={styles.modalInput} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                                    </div>
                                    <div className={styles.modalRow}>
                                        <input
                                            className={styles.modalInput}
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                                            placeholder="Quantity"
                                            required
                                        />
                                        <input className={styles.modalInput} value={directContact} onChange={(e) => setDirectContact(e.target.value)} placeholder="Direct contact" required />
                                    </div>
                                    <textarea className={styles.modalInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job description" required />
                                </div>

                                <div className={styles.modalUploadStack}>
                                    <div className={styles.modalUploadCol}>
                                        <input
                                            className={styles.fileInput}
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                                            required
                                        />
                                        <div className={styles.uploadIcon}>☁️</div>
                                        {jdFile ? (
                                            <p className={styles.uploadText}>Selected: {jdFile.name}</p>
                                        ) : (
                                            <>
                                                <p className={styles.uploadText}><span>Upload</span> JD PDF here</p>
                                                <p className={styles.uploadSubText}>Only PDF files are accepted</p>
                                            </>
                                        )}
                                    </div>

                                    <div className={styles.modalUploadCol}>
                                        <input
                                            className={styles.fileInput}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
                                        />
                                        <div className={styles.uploadIcon}>🖼️</div>
                                        {coverImageFile ? (
                                            <p className={styles.uploadText}>Cover: {coverImageFile.name}</p>
                                        ) : (
                                            <>
                                                <p className={styles.uploadText}><span>Upload</span> Cover Image</p>
                                                <p className={styles.uploadSubText}>Optional: jpg, jpeg, png, webp</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.button} type="submit">Create Job Card & Upload JD</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CV Contact Modal: xem chi tiết CV từ dashboard. */}
            {selectedLog && session && activeWorkspace === "overview" && (
                <div className={styles.popupOverlay}>
                    <div className={styles.popupCard}>
                        <button className={styles.popupClose} onClick={() => setSelectedLog(null)}>×</button>
                        <div className={styles.popupHeader}>
                            <h3>Candidate Contact Details</h3>
                            <p>From CV log for application #{selectedLog.application_id}</p>
                        </div>

                        <div className={styles.contactGrid}>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Candidate</p>
                                <p className={styles.contactValue}>{selectedLog.candidate_name || "-"}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Email</p>
                                <p className={styles.contactValue}>{selectedLog.candidate_email || "-"}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Phone</p>
                                <p className={styles.contactValue}>{selectedLog.candidate_phone || "-"}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Job</p>
                                <p className={styles.contactValue}>{selectedLog.job_title}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Screening status</p>
                                <p className={styles.contactValue}>
                                    <span className={`${styles.statusBadge} ${getScoreStatusClass(selectedScoreStatus)}`}>
                                        {getScoreStatusLabel(selectedScoreStatus)}
                                    </span>
                                </p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Score</p>
                                <p className={styles.contactValue}>{formatScore(selectedLog.ai_matching_score)}/100</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Application status</p>
                                <p className={styles.contactValue}>{selectedLog.status}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Scored / submitted at</p>
                                <p className={styles.contactValue}>{formatLogTime(selectedLog.created_at)}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>CV file</p>
                                <p className={styles.contactValue}>{selectedLog.cv_id ? `CV #${selectedLog.cv_id}` : "Waiting for CV file"}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Recommendation</p>
                                <p className={styles.contactValue}>{selectedRecommendation}</p>
                            </div>
                        </div>

                        <div className={styles.matchingDetails}>
                            <div className={styles.matchingDetailsHeader}>
                                <div>
                                    <p className={styles.contactLabel}>Matching Details</p>
                                    <h4>Why this score?</h4>
                                </div>
                                <p className={styles.matchingOverallScore}>
                                    {formatScore(selectedLog.ai_matching_score)}/100
                                </p>
                            </div>

                            {selectedMatchingDetail ? (
                                <>
                                    <div className={styles.scoreBreakdownGrid}>
                                        <div>
                                            <span>Skills</span>
                                            <strong>{formatScore(getSectionScore(selectedMatchingDetail, ["technical_skills", "programming_languages"]))}/100</strong>
                                        </div>
                                        <div>
                                            <span>Experience</span>
                                            <strong>{formatScore(getSectionScore(selectedMatchingDetail, ["experience"]))}/100</strong>
                                        </div>
                                        <div>
                                            <span>Education</span>
                                            <strong>{formatScore(getSectionScore(selectedMatchingDetail, ["education"]))}/100</strong>
                                        </div>
                                        <div>
                                            <span>Language</span>
                                            <strong>{formatScore(getSectionScore(selectedMatchingDetail, ["natural_languages"]))}/100</strong>
                                        </div>
                                        <div>
                                            <span>Projects</span>
                                            <strong>{formatScore(getSectionScore(selectedMatchingDetail, ["projects"]))}/100</strong>
                                        </div>
                                        <div>
                                            <span>JD requirements</span>
                                            <strong>{formatScore(getSectionScore(selectedMatchingDetail, ["responsibilities"]))}/100</strong>
                                        </div>
                                    </div>

                                    <div className={styles.detailSignalGrid}>
                                        <div>
                                            <p className={styles.matchingColumnTitle}>Matched skills</p>
                                            {selectedMatchedSkills.length > 0 ? (
                                                <ul className={styles.matchingList}>
                                                    {selectedMatchedSkills.map((item) => (
                                                        <li className={styles.goodPoint} key={`matched-skill-${item}`}>
                                                            <span>✓</span>{item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className={styles.emptyDetailMessage}>No matched skill field from backend.</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className={styles.matchingColumnTitle}>Missing skills</p>
                                            {selectedMissingSkills.length > 0 ? (
                                                <ul className={styles.matchingList}>
                                                    {selectedMissingSkills.map((item) => (
                                                        <li className={styles.missingPoint} key={`missing-skill-${item}`}>
                                                            <span>✕</span>{item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className={styles.emptyDetailMessage}>No missing skill field from backend.</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className={styles.matchingColumnTitle}>Experience / evidence</p>
                                            {selectedExperienceGood.length > 0 ? (
                                                <ul className={styles.matchingList}>
                                                    {selectedExperienceGood.map((item) => (
                                                        <li className={styles.goodPoint} key={`experience-good-${item}`}>
                                                            <span>✓</span>{item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className={styles.emptyDetailMessage}>No experience evidence field from backend.</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className={styles.matchingColumnTitle}>Relevant projects</p>
                                            {selectedRelevantProjects.length > 0 ? (
                                                <ul className={styles.matchingList}>
                                                    {selectedRelevantProjects.map((item) => (
                                                        <li className={styles.goodPoint} key={`project-good-${item}`}>
                                                            <span>✓</span>{item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className={styles.emptyDetailMessage}>No relevant project field from backend.</p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedMissingRequirements.length > 0 && (
                                        <div className={styles.requirementWarning}>
                                            <p className={styles.matchingColumnTitle}>Missing requirements</p>
                                            <ul className={styles.matchingList}>
                                                {selectedMissingRequirements.map((item) => (
                                                    <li className={styles.missingPoint} key={`missing-req-${item}`}>
                                                        <span>✕</span>{item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {selectedMustHave && (
                                        <div className={styles.mustHaveGrid}>
                                            <div>
                                                <p className={styles.matchingColumnTitle}>Must-have matched</p>
                                                {selectedMustHave.matched && selectedMustHave.matched.length > 0 ? (
                                                    <ul className={styles.matchingList}>
                                                        {selectedMustHave.matched.map((item) => (
                                                            <li className={styles.goodPoint} key={`must-have-good-${item}`}>
                                                                <span>✓</span>{item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className={styles.emptyDetailMessage}>No must-have match recorded.</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className={styles.matchingColumnTitle}>Must-have missing</p>
                                                {selectedMustHave.missing && selectedMustHave.missing.length > 0 ? (
                                                    <ul className={styles.matchingList}>
                                                        {selectedMustHave.missing.map((item) => (
                                                            <li className={styles.missingPoint} key={`must-have-missing-${item}`}>
                                                                <span>✕</span>{item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className={styles.emptyDetailMessage}>No missing must-have recorded.</p>
                                                )}
                                                {typeof selectedMustHave.penalty_applied === "number" && selectedMustHave.penalty_applied > 0 && (
                                                    <p className={styles.penaltyText}>
                                                        Penalty applied: {selectedMustHave.penalty_applied.toFixed(1)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {renderableMatchingSections.length > 0 ? (
                                        <div className={styles.matchingSectionList}>
                                            {renderableMatchingSections.map((section) => (
                                                <section className={styles.matchingSection} key={section.key}>
                                                    <div className={styles.matchingSectionHeader}>
                                                        <h5>{section.label || section.key}</h5>
                                                        {typeof section.score === "number" && (
                                                            <span>{section.score.toFixed(1)}/100</span>
                                                        )}
                                                    </div>
                                                    {section.explanation && (
                                                        <p className={styles.matchingExplanation}>{section.explanation}</p>
                                                    )}
                                                    <div className={styles.matchingColumns}>
                                                        <div>
                                                            <p className={styles.matchingColumnTitle}>Good</p>
                                                            {section.good && section.good.length > 0 ? (
                                                                <ul className={styles.matchingList}>
                                                                    {section.good.map((point) => (
                                                                        <li className={styles.goodPoint} key={`${section.key}-good-${point}`}>
                                                                            <span>✓</span>{point}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className={styles.emptyDetailMessage}>No good point recorded.</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className={styles.matchingColumnTitle}>Missing</p>
                                                            {section.missing && section.missing.length > 0 ? (
                                                                <ul className={styles.matchingList}>
                                                                    {section.missing.map((point) => (
                                                                        <li className={styles.missingPoint} key={`${section.key}-missing-${point}`}>
                                                                            <span>✕</span>{point}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className={styles.emptyDetailMessage}>No missing point recorded.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </section>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.emptyDetailMessage}>
                                            Detailed matching explanation has no renderable sections.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className={styles.emptyDetailMessage}>
                                    Detailed matching explanation is not available for this application.
                                </p>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            {selectedLog.isMock ? (
                                <p className={styles.emptyDetailMessage}>Mock CV data only. No backend CV file is available.</p>
                            ) : (
                                <>
                                    <a
                                        className={styles.button}
                                        href={getRecruiterCvFileUrl(session.user_id, selectedLog.application_id, true)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View CV in Browser
                                    </a>
                                    <a
                                        className={styles.navButton}
                                        href={getRecruiterCvFileUrl(session.user_id, selectedLog.application_id)}
                                    >
                                        Download CV
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
