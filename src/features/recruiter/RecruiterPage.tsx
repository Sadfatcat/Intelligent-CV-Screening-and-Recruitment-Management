"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../app/recruiter_UI/page.module.css";
import { RecruiterSidebar } from "./components/RecruiterSidebar";
import { RecruiterStatCard } from "./components/RecruiterStatCard";
import { RecruiterToast } from "./components/RecruiterToast";
import { RECRUITER_SESSION_STORAGE_KEY } from "./constants/recruiterConstants";
import {
    deleteApplication,
    fetchRecruiterCvLogs,
    fetchRecruiterJobs,
    fetchRecruiterProfile,
    getRecruiterCvFileUrl,
    updateRecruiterJobStatus,
    uploadJobDescription,
} from "./services/recruiterApi";
import type { CVLogItem, CvSortMode, ExperienceFilter, JobManagementStatus, RecruiterJob, RecruiterSession, ScoreStatus, ScoringSubTab } from "./types/recruiterTypes";
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

type RecruiterWorkspace = "overview" | "jobs" | "applications";
type DashboardRange = "today" | "7d" | "30d" | "all";
type DonutChartItem = {
    label: string;
    value: number;
    color: string;
    range?: string;
};

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
        draft: styles.jobStatusTurnedOff,
        active: styles.jobStatusActive,
        turned_off: styles.jobStatusTurnedOff,
        closed: styles.jobStatusDeleted,
        deleted: styles.jobStatusDeleted,
    };
    return classes[status];
}

type RecruiterPageProps = {
    defaultWorkspace?: RecruiterWorkspace;
};

function isWithinDashboardRange(value: string | null | undefined, range: DashboardRange) {
    if (!value) return range === "all";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return range === "all";
    if (range === "all") return true;

    const now = new Date();
    if (range === "today") {
        return date.toDateString() === now.toDateString();
    }

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

function RoundedDonutChart({
    data,
    size = 240,
    innerRadius = 64,
    outerRadius = 104,
    gapAngle = 8,
    startAngle = -82,
}: {
    data: DonutChartItem[];
    size?: number;
    innerRadius?: number;
    outerRadius?: number;
    gapAngle?: number;
    startAngle?: number;
}) {
    const visibleItems = data.filter((item) => item.value > 0);
    const total = visibleItems.reduce((sum, item) => sum + item.value, 0);
    const center = size / 2;
    const radius = (innerRadius + outerRadius) / 2;
    const strokeWidth = outerRadius - innerRadius;
    const effectiveGap = visibleItems.length > 1 ? gapAngle : 0;
    let currentAngle = startAngle;

    function pointOnRing(angle: number) {
        const radians = (Math.PI / 180) * angle;
        return {
            x: center + radius * Math.cos(radians),
            y: center + radius * Math.sin(radians),
        };
    }

    return (
        <div className={styles.pieWrap} style={{ width: size, maxWidth: "100%" }}>
            <svg className={styles.pieChart} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution chart">
                {total > 0 ? visibleItems.map((item) => {
                    const rawAngle = (item.value / total) * 360;
                    const segmentAngle = Math.max(2, rawAngle - effectiveGap);
                    const segmentStart = currentAngle + effectiveGap / 2;
                    const segmentEnd = segmentStart + segmentAngle;
                    const start = pointOnRing(segmentStart);
                    const end = pointOnRing(segmentEnd);
                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    const path =
                        visibleItems.length === 1
                            ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius}`
                            : `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
                    currentAngle += rawAngle;

                    return (
                        <path
                            key={item.label}
                            className={styles.pieSlice}
                            d={path}
                            style={{ stroke: item.color, strokeWidth }}
                        />
                    );
                }) : (
                    <circle className={styles.sliceEmpty} cx={center} cy={center} r={radius} style={{ strokeWidth }} />
                )}
            </svg>
            <div
                className={styles.pieCenter}
                style={{
                    width: innerRadius * 1.42,
                    height: innerRadius * 1.42,
                    borderWidth: Math.max(8, strokeWidth * 0.26),
                }}
            >
                <strong>{total}</strong>
                <span>Total</span>
            </div>
        </div>
    );
}

export default function RecruiterUIPage({ defaultWorkspace = "overview" }: RecruiterPageProps) {
    const router = useRouter();
    const [session, setSession] = useState<RecruiterSession | null>(null);
    const [isSessionChecked, setIsSessionChecked] = useState(false);

    const [title, setTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [location, setLocation] = useState("");
    const [level, setLevel] = useState("Junior");
    const [deadline, setDeadline] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [salary, setSalary] = useState("");
    const [directContact, setDirectContact] = useState("");
    const [description, setDescription] = useState("");
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    const [jobs, setJobs] = useState<RecruiterJob[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [cvLogs, setCvLogs] = useState<CVLogItem[]>([]);
    const [selectedLog, setSelectedLog] = useState<CVLogItem | null>(null);
    const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
    const [scoreStatusFilter, setScoreStatusFilter] = useState<ScoreStatus | "all">("all");
    const [scoreRangeFilter, setScoreRangeFilter] = useState<"all" | "85-100" | "50-84" | "0-49">("all");
    const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>("all");
    const [screeningSearch, setScreeningSearch] = useState("");
    const [isScreeningLoading, setIsScreeningLoading] = useState(false);
    const [screeningError, setScreeningError] = useState("");
    const [activeWorkspace, setActiveWorkspace] = useState<RecruiterWorkspace>(defaultWorkspace);
    const [scoringSubTab, setScoringSubTab] = useState<ScoringSubTab>(defaultWorkspace === "applications" ? "cvs" : "jobs");
    const [jdSearchInput, setJdSearchInput] = useState("");
    const [jdSearchTerm, setJdSearchTerm] = useState("");
    const [jobPage, setJobPage] = useState(1);
    const [selectedScreeningLog, setSelectedScreeningLog] = useState<CVLogItem | null>(null);
    const [cvSortMode, setCvSortMode] = useState<CvSortMode>("score");
    const [storedFptCvLogs, setStoredFptCvLogs] = useState<CVLogItem[]>([]);
    const [isScoringSummaryOpen, setIsScoringSummaryOpen] = useState(false);
    const [dashboardRange, setDashboardRange] = useState<DashboardRange>("7d");
    const recruiterCvDetailHistoryRef = useRef(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const isFptRecruiter = isFptSession(session, companyName);
    const recruiterJobs = useMemo(
        () => (isFptRecruiter ? [...jobs, ...MOCK_RECRUITER_JOBS] : jobs),
        [isFptRecruiter, jobs]
    );
    const getManagedJobStatus = useCallback(
        (jobId: number): JobManagementStatus => recruiterJobs.find((job) => job.id === jobId)?.status || "active",
        [recruiterJobs]
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
        [getManagedJobStatus, recruiterJobs]
    );

    useEffect(() => {
        const saved = localStorage.getItem(RECRUITER_SESSION_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as RecruiterSession;
                if (parsed.role === "recruiter" && !parsed.must_change_password) {
                    window.setTimeout(() => setSession(parsed), 0);
                }
            } catch {
                localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
            }
        }
        window.setTimeout(() => setIsSessionChecked(true), 0);
    }, []);

    useEffect(() => {
        if (isSessionChecked && !session) {
            router.replace("/login");
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

        const loadTimer = window.setTimeout(() => {
            fetchRecruiterJobs(session.user_id)
                .then(setJobs)
                .catch((err) => {
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
        }, 0);

        return () => window.clearTimeout(loadTimer);
    }, [session]);

    function handleLogout() {
        localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
        localStorage.removeItem("currentUser");
        setSession(null);
        setSelectedJobId(null);
        setCvLogs([]);
        setIsUploadPopupOpen(false);
        setMessage("Logged out");
        setMessageType("success");
        router.push("/login");
    }

    async function setManagedJobStatus(jobId: number, status: JobManagementStatus) {
        if (!session) return;
        const job = recruiterJobs.find((item) => item.id === jobId);
        if (job?.isMock) {
            setMessage("Mock job status changes are not saved to backend.");
            setMessageType("error");
            return;
        }

        try {
            await updateRecruiterJobStatus(session.user_id, jobId, status);
            await loadRecruiterJobs(session.user_id);
            setCvLogs(await fetchRecruiterCvLogs(session.user_id));
            setMessage(
                status === "turned_off"
                    ? "Job turned off. It is hidden from the public recruitment page, but submitted CVs remain accessible."
                    : status === "active"
                        ? "Job restored to the active list."
                        : status === "deleted"
                            ? "Job deleted from public and recruiter active management. Submitted CV history is preserved."
                            : "Job status updated."
            );
            setMessageType("success");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Update job status failed");
            setMessageType("error");
        }
    }

    async function handleDeleteSelectedCv(log: CVLogItem) {
        if (!session) return;
        if (log.isMock) {
            setMessage("Mock CV records cannot be deleted from backend.");
            setMessageType("error");
            return;
        }
        const candidateLabel = log.candidate_name?.trim() || `application #${log.application_id}`;
        if (!window.confirm(`Delete CV for ${candidateLabel}? This removes the submitted CV record from recruiter views.`)) return;

        try {
            await deleteApplication(session.user_id, log.application_id);
            const refreshedLogs = await fetchRecruiterCvLogs(session.user_id);
            setCvLogs(refreshedLogs);
            setSelectedScreeningLog(null);
            setSelectedLog(null);
            setScoringSubTab("cvs");
            setMessage("Submitted CV deleted successfully.");
            setMessageType("success");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Delete CV failed");
            setMessageType("error");
        }
    }

    function handleTurnOffJob(jobId: number) {
        void setManagedJobStatus(jobId, "turned_off");
    }

    function handleRestoreJob(jobId: number) {
        void setManagedJobStatus(jobId, "active");
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
                salary,
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
            setSalary("");
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
        void setManagedJobStatus(jobId, "deleted");
        if (selectedJobId === jobId) {
            setSelectedJobId(null);
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

    const allScreeningSummary = useMemo(
        () => calculateSummary(recruiterCvLogs),
        [recruiterCvLogs]
    );

    const dashboardLogs = useMemo(
        () => recruiterCvLogs.filter((log) => isWithinDashboardRange(log.created_at, dashboardRange)),
        [dashboardRange, recruiterCvLogs]
    );

    const dashboardSummary = useMemo(() => {
        const scores = recruiterCvLogs
            .map((log) => normalizeScore(log.ai_matching_score))
            .filter((score): score is number => score !== null);
        const newApplications = recruiterCvLogs.filter((log) => isWithinDashboardRange(log.created_at, "today")).length;
        const pendingReviews = recruiterCvLogs.filter((log) => log.status === "pending").length;
        const shortlistedCandidates = recruiterCvLogs.filter((log) => {
            const score = normalizeScore(log.ai_matching_score);
            return log.status === "accepted" || (score !== null && score >= 85);
        }).length;

        return {
            activeJobs: managedRecruiterJobs.filter((job) => getManagedJobStatus(job.id) === "active").length,
            totalApplications: recruiterCvLogs.length,
            newApplications,
            pendingReviews,
            averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
            shortlistedCandidates,
        };
    }, [getManagedJobStatus, managedRecruiterJobs, recruiterCvLogs]);

    const screeningDistribution = useMemo(() => {
        return [
            { label: "Failed", value: allScreeningSummary.failed, color: "#f4a6a6" },
            { label: "Passed", value: allScreeningSummary.passed, color: "#9bd8b2" },
            { label: "Borderline", value: allScreeningSummary.borderline, color: "#f4c48d" },
        ];
    }, [allScreeningSummary]);

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

    const applicationsOverTime = useMemo(() => {
        const grouped = new Map<string, { date: string; newApplications: number; reviewedApplications: number }>();
        dashboardLogs.forEach((log) => {
            const date = new Date(log.created_at);
            if (Number.isNaN(date.getTime())) return;
            const key = date.toISOString().slice(0, 10);
            const current = grouped.get(key) || { date: key, newApplications: 0, reviewedApplications: 0 };
            current.newApplications += 1;
            if (log.status !== "pending") {
                current.reviewedApplications += 1;
            }
            grouped.set(key, current);
        });
        return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [dashboardLogs]);

    const jobPerformanceRows = useMemo(() => {
        return managedRecruiterJobs.map((job) => {
            const logs = recruiterCvLogs.filter((log) => log.job_id === job.id);
            const scores = logs
                .map((log) => normalizeScore(log.ai_matching_score))
                .filter((score): score is number => score !== null);
            const averageScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
            return {
                job,
                status: getManagedJobStatus(job.id),
                totalApplications: logs.length,
                newCvs: logs.filter((log) => isWithinDashboardRange(log.created_at, "today")).length,
                averageScore,
                highMatchCount: scores.filter((score) => score >= 90).length,
                pendingReviews: logs.filter((log) => log.status === "pending").length,
            };
        });
    }, [getManagedJobStatus, managedRecruiterJobs, recruiterCvLogs]);

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
    const selectedCvProjects = activeDetailLog?.projects || [];
    const selectedCvExperience = activeDetailLog?.work_experience || [];
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

    function openScreeningDetail(log: CVLogItem) {
        if (typeof window !== "undefined" && !recruiterCvDetailHistoryRef.current) {
            window.history.pushState({ ...(window.history.state || {}), intelliCvRecruiterCvDetail: true }, "", window.location.href);
            recruiterCvDetailHistoryRef.current = true;
        }

        setSelectedScreeningLog(log);
        setSelectedJobId(log.job_id);
        setSelectedLog(null);
        setScoringSubTab("detail");
    }

    function handleBackFromScreeningDetail() {
        if (typeof window !== "undefined" && recruiterCvDetailHistoryRef.current) {
            window.history.back();
            return;
        }

        setSelectedScreeningLog(null);
        setScoringSubTab("cvs");
    }

    useEffect(() => {
        function handlePopState() {
            if (!recruiterCvDetailHistoryRef.current) return;
            recruiterCvDetailHistoryRef.current = false;
            setSelectedScreeningLog(null);
            setScoringSubTab("cvs");
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

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

    function openApplicationsForJob(jobId: number) {
        setSelectedJobId(jobId);
        setSelectedScreeningLog(null);
        setSelectedLog(null);
        setScoringSubTab("cvs");
        setActiveWorkspace("applications");
        router.push("/recruiter/applications");
    }

    function renderPieChart(items: DonutChartItem[]) {
        return (
            <div className={styles.chartPanel}>
                <RoundedDonutChart
                    data={items}
                    size={240}
                    innerRadius={64}
                    outerRadius={106}
                    gapAngle={9}
                    startAngle={-82}
                />
                <div className={styles.chartLegend}>
                    {items.map((item) => (
                        <span key={item.label}>
                            <i style={{ background: item.color }} />
                            {item.label}{item.range ? `: ${item.range}` : ""} <strong>{item.value}</strong>
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    function renderApplicationsLineChart() {
        if (!applicationsOverTime.length) {
            return <p className={styles.tableState}>No applications in this period.</p>;
        }

        const width = 760;
        const height = 240;
        const paddingLeft = 48;
        const paddingRight = 24;
        const paddingTop = 24;
        const paddingBottom = 46;
        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;
        const maxValue = Math.max(1, ...applicationsOverTime.flatMap((point) => [point.newApplications, point.reviewedApplications]));
        const denominator = Math.max(1, applicationsOverTime.length - 1);

        const toPoint = (value: number, index: number) => {
            const x = paddingLeft + (chartWidth * index) / denominator;
            const y = paddingTop + chartHeight - (value / maxValue) * chartHeight;
            return `${x},${y}`;
        };

        const newPoints = applicationsOverTime.map((item, index) => toPoint(item.newApplications, index)).join(" ");
        const reviewedPoints = applicationsOverTime.map((item, index) => toPoint(item.reviewedApplications, index)).join(" ");
        const yTicks = [maxValue, Math.ceil(maxValue / 2), 0];

        return (
            <div className={styles.lineChartSurface}>
                <svg className={styles.lineChartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Applications over time line chart">
                    {yTicks.map((tick) => {
                        const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
                        return (
                            <g key={`tick-${tick}`}>
                                <line className={styles.chartGridLine} x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} />
                                <text className={styles.chartAxisLabel} x={12} y={y + 4}>{tick}</text>
                            </g>
                        );
                    })}
                    <line className={styles.chartAxisLine} x1={paddingLeft} x2={paddingLeft} y1={paddingTop} y2={height - paddingBottom} />
                    <line className={styles.chartAxisLine} x1={paddingLeft} x2={width - paddingRight} y1={height - paddingBottom} y2={height - paddingBottom} />
                    <polyline className={styles.newApplicationsLine} points={newPoints} />
                    <polyline className={styles.reviewedApplicationsLine} points={reviewedPoints} />
                    {applicationsOverTime.map((item, index) => {
                        const [newX, newY] = toPoint(item.newApplications, index).split(",").map(Number);
                        const [reviewedX, reviewedY] = toPoint(item.reviewedApplications, index).split(",").map(Number);
                        const showLabel = applicationsOverTime.length <= 12 || index === 0 || index === applicationsOverTime.length - 1 || index % 3 === 0;
                        return (
                            <g key={item.date}>
                                <circle className={styles.newApplicationsPoint} cx={newX} cy={newY} r="4" />
                                <circle className={styles.reviewedApplicationsPoint} cx={reviewedX} cy={reviewedY} r="4" />
                                {showLabel && (
                                    <text className={styles.chartXAxisLabel} x={newX} y={height - 16} textAnchor="middle">
                                        {formatDashboardDate(item.date)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    }

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
                    router.push("/recruiter_UI");
                }}
                onOpenJobs={() => {
                    setActiveWorkspace("jobs");
                    setSelectedLog(null);
                    setSelectedScreeningLog(null);
                    setScoringSubTab("jobs");
                    setIsScoringSummaryOpen(false);
                    router.push("/recruiter/jobs");
                }}
                onOpenApplications={() => {
                    setActiveWorkspace("applications");
                    setSelectedLog(null);
                    setSelectedScreeningLog(null);
                    setScoringSubTab("cvs");
                    setIsScoringSummaryOpen(false);
                    router.push("/recruiter/applications");
                }}
                onOpenUpload={() => setIsUploadPopupOpen(true)}
                onLogout={handleLogout}
            />

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>
                        {activeWorkspace === "jobs"
                            ? "Job Management"
                            : activeWorkspace === "applications"
                                ? "Submitted CV Management"
                                : "Recruiter Dashboard"}
                    </h1>
                    <p>
                        {activeWorkspace === "jobs"
                            ? "Create, search, and manage uploaded job descriptions."
                            : activeWorkspace === "applications"
                                ? "Review submitted CVs, matching scores, and candidate details."
                                : "Overview analytics for jobs, applications, screening results, and recent activity."}
                    </p>
                </header>

                <main className={styles.contentArea}>
                    <RecruiterToast message={message} type={messageType} />
                    {activeWorkspace !== "overview" ? (
                        <>
                            {activeWorkspace === "applications" && (
                            <nav className={styles.subTabs} aria-label="Submitted CV views">
                                <button
                                    className={`${styles.subTabButton} ${scoringSubTab === "jobs" ? styles.subTabButtonActive : ""}`}
                                    type="button"
                                    onClick={() => {
                                        setActiveWorkspace("jobs");
                                        router.push("/recruiter/jobs");
                                        setSelectedScreeningLog(null);
                                    }}
                                >
                                    Job Management
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
                            )}

                            {/* Job List: chọn JD trước khi xem CV. */}
                            {activeWorkspace === "jobs" && (
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
                                                <th>Salary</th>
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
                                                        <td>{job.salary || "-"}</td>
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
                                                    <td colSpan={9}>
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
                            {activeWorkspace === "applications" && scoringSubTab === "cvs" && (
                                <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                                    <div className={styles.panelTitleRow}>
                                        <div>
                                            <h3>Submitted CVs</h3>
                                            <p className={styles.subtleText}>
                                                Listing submitted CVs from every JD. Click a row to open the focused scoring view.
                                            </p>
                                        </div>
                                        <div className={styles.actionConfirmBox}>
	                                            <button className={styles.clearFilterBtn} type="button" onClick={() => {
	                                                setActiveWorkspace("jobs");
	                                                setScoringSubTab("jobs");
	                                                router.push("/recruiter/jobs");
	                                            }}>
	                                                Back to Job Management
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
                                                            onClick={() => openScreeningDetail(log)}
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
                            {activeWorkspace === "applications" && scoringSubTab === "detail" && (
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
                                        <div className={styles.actionConfirmBox}>
                                            <button className={styles.deleteCvBtn} type="button" onClick={() => void handleDeleteSelectedCv(selectedScreeningLog)}>
                                                Delete CV
                                            </button>
                                            <button className={styles.clearFilterBtn} type="button" onClick={handleBackFromScreeningDetail}>
                                                Back to Submitted CVs
                                            </button>
                                        </div>
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
                                            <p className={styles.contactLabel}>Experience</p>
                                            <ul className={styles.matchingList}>
                                                {selectedCvExperience.length ? selectedCvExperience.map((item) => (
                                                    <li key={`work-${item}`}>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>Experience is not available from the CV text.</li>}
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
                                            <p className={styles.contactLabel}>Matching Experience Evidence</p>
                                            <ul className={styles.matchingList}>
                                                {selectedExperienceGood.length ? selectedExperienceGood.map((item) => (
                                                    <li className={styles.goodPoint} key={`detail-exp-${item}`}><span>✓</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>No experience evidence recorded.</li>}
                                            </ul>
                                        </article>
                                        <article className={styles.kanbanBlock}>
                                            <p className={styles.contactLabel}>Projects</p>
                                            <ul className={styles.matchingList}>
                                                {selectedCvProjects.length ? selectedCvProjects.map((item) => (
                                                    <li key={`detail-project-${item}`}>{item}</li>
                                                )) : selectedRelevantProjects.length ? selectedRelevantProjects.map((item) => (
                                                    <li className={styles.goodPoint} key={`detail-project-${item}`}><span>✓</span>{item}</li>
                                                )) : <li className={styles.emptyDetailMessage}>Projects are not available from the CV text.</li>}
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
	                    <RecruiterStatCard label="Active Jobs" value={dashboardSummary.activeJobs} tone="neutral" />
	                    <RecruiterStatCard label="Total Applications" value={dashboardSummary.totalApplications} tone="neutral" />
	                    <RecruiterStatCard label="New Applications" value={dashboardSummary.newApplications} tone="scored" />
	                    <RecruiterStatCard label="Pending Reviews" value={dashboardSummary.pendingReviews} tone="borderline" />
	                    <RecruiterStatCard label="Average Matching Score" value={formatScore(dashboardSummary.averageScore)} tone="passed" />
	                    <RecruiterStatCard label="Shortlisted Candidates" value={dashboardSummary.shortlistedCandidates} tone="passed" />

	                    <section className={`${styles.card} ${styles.panelCard} ${styles.chartCard}`}>
	                        <div className={styles.panelTitleRow}>
	                            <div>
	                                <h3>Screening Result Distribution</h3>
	                            </div>
	                        </div>
	                        {renderPieChart(screeningDistribution)}
	                    </section>

	                    <section className={`${styles.card} ${styles.panelCard} ${styles.chartCard}`}>
	                        <div className={styles.panelTitleRow}>
	                            <div>
	                                <h3>Matching Score Distribution</h3>
	                            </div>
	                        </div>
	                        {renderPieChart(scoreDistribution)}
	                    </section>

	                    <section className={`${styles.card} ${styles.panelCard} ${styles.lineChartCard}`} style={{ gridColumn: "1 / -1" }}>
	                        <div className={styles.panelTitleRow}>
	                            <div>
	                                <h3>Applications Over Time</h3>
	                            </div>
	                            <div className={styles.rangeControl}>
	                                {(["today", "7d", "30d", "all"] as DashboardRange[]).map((range) => (
	                                    <button
	                                        key={range}
	                                        className={`${styles.rangeButton} ${dashboardRange === range ? styles.rangeButtonActive : ""}`}
	                                        type="button"
	                                        onClick={() => setDashboardRange(range)}
	                                    >
	                                        {range === "today" ? "Today" : range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
	                                    </button>
	                                ))}
	                            </div>
	                        </div>
	                        <div className={styles.lineChart}>
	                            {renderApplicationsLineChart()}
	                        </div>
	                        <div className={styles.chartLegendInline}>
	                            <span><i className={styles.newApplicationBarLegend} />New applications</span>
	                            <span><i className={styles.reviewedApplicationBarLegend} />Reviewed applications</span>
	                        </div>
	                    </section>

	                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
	                        <div className={styles.panelTitleRow}>
	                            <div>
	                                <h3>Job Performance</h3>
	                            </div>
	                            <button className={styles.clearFilterBtn} type="button" onClick={() => {
	                                setActiveWorkspace("jobs");
	                                router.push("/recruiter/jobs");
	                            }}>
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
	                                                <span className={`${styles.jobStatusPill} ${getJobManagementClass(row.status)}`}>
	                                                    {getJobManagementLabel(row.status)}
	                                                </span>
	                                            </td>
	                                            <td>{row.totalApplications}</td>
	                                            <td>{row.newCvs}</td>
	                                            <td>{formatScore(row.averageScore)}</td>
	                                            <td>{row.highMatchCount}</td>
	                                            <td>{row.pendingReviews}</td>
	                                            <td>
	                                                <button className={styles.clearFilterBtn} type="button" onClick={() => openApplicationsForJob(row.job.id)}>
	                                                    View CVs
	                                                </button>
	                                            </td>
	                                        </tr>
	                                    ))}
	                                    {jobPerformanceRows.length === 0 && (
	                                        <tr>
	                                            <td colSpan={8}>No jobs available.</td>
	                                        </tr>
	                                    )}
	                                </tbody>
	                            </table>
	                        </div>
	                    </section>

	                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
	                        <div className={styles.panelTitleRow}>
	                            <div>
	                                <h3>Activity Logs</h3>
	                            </div>
	                            <button className={styles.clearFilterBtn} type="button" onClick={() => {
	                                setActiveWorkspace("applications");
	                                setScoringSubTab("cvs");
	                                router.push("/recruiter/applications");
	                            }}>
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
                    )}

                </main>
            </div>

            {/* CV Scoring Summary Popup: xem nhanh tình trạng CV theo từng JD. */}
            {isScoringSummaryOpen && activeWorkspace === "jobs" && selectedJob && (
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
                                    <input
                                        className={styles.modalInput}
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        placeholder="Salary, e.g. 15-25 million VND or Negotiable"
                                        required
                                    />
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
            {selectedLog && session && activeWorkspace === "applications" && (
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
