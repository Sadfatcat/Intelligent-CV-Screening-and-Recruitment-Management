"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import brightStyles from "./page.bright.module.css";
import darkStyles from "./page.dark.module.css";
// import { handleLoginSubmit } from "@/utils/loginHandler";
// import Image from "next/image";
import Navbar from "@/components/navbar/Navbar_candidate";
import Jobcard from "@/components/Jobcard";
import { MOCK_JOB_DESCRIPTIONS } from "@/mock/cvScreeningMockData";
import { apiUrl } from "@/utils/api";

const JOB_MANAGEMENT_STORAGE_KEY = "recruiterJobManagementState";
const FPT_MOCK_APPLICATIONS_STORAGE_KEY = "fptMockSubmittedCvLogs";

type JobItem = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity?: number | null;
    salary?: string | null;
    direct_contact?: string | null;
    image_url?: string;
    description: string;
    requirements?: string;
    jd_file_path?: string | null;
    isMock?: boolean;
};

type CandidateSubmissionItem = {
    application_id: number;
    job_id: number;
    job_title: string;
    company_name: string;
    location: string;
    level: string;
    deadline?: string | null;
    quantity?: number | null;
    salary?: string | null;
    direct_contact?: string | null;
    image_url?: string | null;
    description?: string | null;
    status: string;
    ai_matching_score: number | null;
    matching_detail?: MatchingDetail | null;
    submitted_at: string | null;
};

type MatchingSection = {
    key: string;
    label: string;
    score?: number | null;
    good?: string[];
    missing?: string[];
    explanation?: string | null;
};

type MatchingDetail = {
    overall_score?: number | null;
    final_score?: number | null;
    sections?: MatchingSection[];
    good_points?: string[];
    missing_points?: string[];
    must_have?: {
        matched?: string[];
        missing?: string[];
        penalty_applied?: number | null;
    };
};

type StoredFptMockApplication = {
    id: number;
    jobId: number;
    jobTitle: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    cvFileName: string;
    submittedAt: string;
    targetPosition: string;
    additionalInfo: string;
};

const MOCK_CANDIDATE_JOBS: JobItem[] = MOCK_JOB_DESCRIPTIONS.map((job) => ({
    id: job.id,
    title: job.title,
    company_name: "FPT Software",
    location: job.location,
    level: job.level,
    deadline: job.createdAt.slice(0, 10),
    quantity: 3,
    salary: "Negotiable",
    direct_contact: "mock-hr@fpt.com",
    description: `${job.department} | ${job.employmentType}. ${job.responsibilities.join(" ")}`,
    requirements: [
        `Required: ${job.requiredSkills.join(", ")}`,
        job.preferredSkills.length ? `Preferred: ${job.preferredSkills.join(", ")}` : "Preferred: none",
        `Experience: ${job.requiredExperienceYears}+ years`,
        `Education: ${job.educationRequirement}`,
        `Languages: ${job.languageRequirements.join(", ")}`,
    ].join(" | "),
    jd_file_path: null,
    isMock: true,
}));

function saveFptMockApplication(application: StoredFptMockApplication) {
    try {
        const raw = localStorage.getItem(FPT_MOCK_APPLICATIONS_STORAGE_KEY);
        const current = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(current) ? current : [];
        localStorage.setItem(FPT_MOCK_APPLICATIONS_STORAGE_KEY, JSON.stringify([application, ...list]));
    } catch {
        localStorage.setItem(FPT_MOCK_APPLICATIONS_STORAGE_KEY, JSON.stringify([application]));
    }
}

function filterPublicJobsByManagementState(items: JobItem[]) {
    try {
        const raw = localStorage.getItem(JOB_MANAGEMENT_STORAGE_KEY);
        if (!raw) return items;
        const state = JSON.parse(raw) as Record<string, string>;
        return items.filter((job) => {
            const status = state[String(job.id)];
            return status !== "turned_off" && status !== "deleted_active";
        });
    } catch {
        return items;
    }
}

function CandidatePageContent() {
    const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("All Jobs"); // Trạng thái filter
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái mở/đóng modal
    const [file, setFile] = useState<File | null>(null); // Lưu trữ file CV được chọn
    const [displayName, setDisplayName] = useState("Candidate");
    const [candidateId, setCandidateId] = useState<number | null>(null);
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [submittedJobs, setSubmittedJobs] = useState<CandidateSubmissionItem[]>([]);
    const [candidateName, setCandidateName] = useState("");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [candidatePhone, setCandidatePhone] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [applyStatus, setApplyStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [theme, setTheme] = useState<"bright" | "dark">("dark");
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<"jobs" | "applications">("jobs");
    const candidateJobDetailHistoryRef = useRef(false);
    const searchParams = useSearchParams();

    async function parseApiResponse(response: Response): Promise<{ data: unknown; message: string }> {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const data = await response.json();
            const message =
                typeof data === "object" && data !== null && "detail" in data
                    ? String((data as { detail?: unknown }).detail || "")
                    : "";
            return { data, message };
        }

        const text = await response.text();
        return { data: null, message: text || "Unexpected server response" };
    }

    const styles = theme === "dark" ? darkStyles : brightStyles;

    const allCategories = [
        "All Jobs",
        "FrontEnd",
        "BackEnd",
        "Full Stack",
        "Mobile Developer",
        "DevOps/Cloud",
        "QA/Testing",
        "AI/ML",
        "Data Scientist",
        "Data Analyst",
        "Big Data Engineer",
        "Database Admin",
        "System Admin",
        "Cybersecurity",
        "UI/UX Designer",
        "Software Architect",
        "Engineering Manager",
        "Business Analyst",
        "Technical Writer",
    ];

    const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 6);

    const filteredJobs = useMemo(() => {
        const byCategory = selectedCategory === "All Jobs" || selectedCategory === "All"
            ? jobs
            : jobs.filter(job => job.title.includes(selectedCategory));

        const q = searchQuery.trim().toLowerCase();
        if (!q) return byCategory;

        return byCategory.filter(job => job.title.toLowerCase().includes(q));
    }, [selectedCategory, searchQuery, jobs]);

    const groupedJobsByCompany = useMemo(() => {
        const grouped = filteredJobs.reduce<Record<string, JobItem[]>>((acc, job) => {
            const company = (job.company_name || "Unknown Company").trim() || "Unknown Company";
            if (!acc[company]) {
                acc[company] = [];
            }
            acc[company].push(job);
            return acc;
        }, {});

        return Object.entries(grouped).sort(([companyA], [companyB]) => companyA.localeCompare(companyB));
    }, [filteredJobs]);

    function formatSubmittedTime(value: string | null) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function normalizeScore(value: number | null | undefined) {
        if (typeof value !== "number" || Number.isNaN(value)) return null;
        return Math.min(100, Math.max(0, value));
    }

    function formatScore(value: number | null | undefined) {
        if (value === null || Number.isNaN(value)) return "-";
        return normalizeScore(value)?.toFixed(0) || "-";
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

    function getImageUrl(value: string | null | undefined) {
        if (!value) return "";
        if (/^https?:\/\//i.test(value)) return value;
        return apiUrl(value);
    }

    function uniqueItems(items: Array<string | null | undefined>) {
        return Array.from(
            new Set(
                items
                    .map((item) => (item || "").trim())
                    .filter(Boolean)
            )
        );
    }

    function getSectionsByKey(detail: MatchingDetail | null | undefined, keys: string[]) {
        return (detail?.sections || []).filter((section) => keys.includes(section.key));
    }

    function getSectionPoints(detail: MatchingDetail | null | undefined, keys: string[], field: "good" | "missing") {
        return getSectionsByKey(detail, keys).flatMap((section) => section[field] || []);
    }

    function getFulfilledCriteria(detail: MatchingDetail | null | undefined) {
        const sectionGood = (detail?.sections || [])
            .filter((section) => (section.good || []).length > 0)
            .flatMap((section) => {
                const label = section.label || section.key;
                return (section.good || []).map((point) => `${label}: ${point}`);
            });

        return uniqueItems([...(detail?.good_points || []), ...(detail?.must_have?.matched || []), ...sectionGood]);
    }

    function getMissingSkills(detail: MatchingDetail | null | undefined) {
        return uniqueItems([
            ...getSectionPoints(detail, ["skills", "technical_skills", "tools"], "missing"),
            ...(detail?.missing_points || []).filter((point) => /skill|tool|framework|language|stack/i.test(point)),
        ]);
    }

    function getMissingRequirements(detail: MatchingDetail | null | undefined) {
        return uniqueItems([
            ...getSectionPoints(detail, ["requirements", "education", "experience", "languages"], "missing"),
            ...(detail?.must_have?.missing || []),
        ]);
    }

    function renderCriteriaList(items: string[], kind: "good" | "skill" | "requirement", emptyText: string) {
        if (items.length === 0) {
            return <p className={styles.criteriaEmpty}>{emptyText}</p>;
        }

        const visibleItems = items.slice(0, 5);
        const overflow = items.length - visibleItems.length;

        return (
            <ul className={styles.criteriaList}>
                {visibleItems.map((item) => (
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

    async function loadSubmittedJobs(candidateIdValue: number) {
        const response = await fetch(apiUrl(`/api/cvs/candidate/${candidateIdValue}/applications`));
        const { data, message } = await parseApiResponse(response);
        if (!response.ok) {
            throw new Error(message || "Failed to load submitted jobs");
        }

        const applications =
            typeof data === "object" &&
            data !== null &&
            "applications" in data &&
            Array.isArray((data as { applications?: unknown }).applications)
                ? ((data as { applications: CandidateSubmissionItem[] }).applications)
                : [];

        setSubmittedJobs(applications);
    }

    useEffect(() => {
        const qsTheme = searchParams.get("theme");
        setTheme(qsTheme === "bright" ? "bright" : "dark");
    }, [searchParams]);

    useEffect(() => {
        const currentUserRaw = localStorage.getItem("currentUser");
        if (!currentUserRaw) return;

        try {
            const currentUser = JSON.parse(currentUserRaw);
            if (typeof currentUser?.user_id === "number") {
                setCandidateId(currentUser.user_id);
            }
            const email = currentUser?.email || currentUser?.user?.email;
            if (typeof email === "string" && email.includes("@")) {
                setDisplayName(email.split("@")[0]);
                setCandidateEmail(email);
            }
        } catch {
            setDisplayName("Candidate");
        }
    }, []);

    useEffect(() => {
        if (candidateId === null) {
            setSubmittedJobs([]);
            return;
        }

        loadSubmittedJobs(candidateId).catch(() => {
            setSubmittedJobs([]);
        });
    }, [candidateId]);

    useEffect(() => {
        fetch(apiUrl("/api/jobs/"))
            .then(async (response) => {
                const { data, message } = await parseApiResponse(response);
                if (!response.ok) {
                    throw new Error(message || "Failed to load jobs");
                }
                const normalizedJobs: JobItem[] = Array.isArray(data)
                    ? data.map((job: JobItem) => ({
                        ...job,
                        image_url: job.image_url ?? undefined,
                    }))
                    : [];
                setJobs(filterPublicJobsByManagementState([...normalizedJobs, ...MOCK_CANDIDATE_JOBS]));
            })
            .catch(() => {
                setJobs(filterPublicJobsByManagementState(MOCK_CANDIDATE_JOBS));
            });
    }, []);

    // onClick cho job cards
    const handleClickjob = (jobData: JobItem) => {
        if (typeof window !== "undefined" && !candidateJobDetailHistoryRef.current) {
            window.history.pushState({ ...(window.history.state || {}), intelliCvCandidateJobDetail: true }, "", window.location.href);
            candidateJobDetailHistoryRef.current = true;
        }
        setSelectedJob(jobData);
        if (jobData.isMock) {
            setIsModalOpen(true);
        }
    }

    function handleBackFromJobDetail() {
        if (typeof window !== "undefined" && candidateJobDetailHistoryRef.current) {
            window.history.back();
            return;
        }

        setSelectedJob(null);
        setIsModalOpen(false);
    }

    useEffect(() => {
        function handlePopState() {
            if (!candidateJobDetailHistoryRef.current) return;
            candidateJobDetailHistoryRef.current = false;
            setSelectedJob(null);
            setIsModalOpen(false);
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFile(null); // Reset file khi đóng modal
        setAdditionalInfo("");
        setApplyStatus(null);
    };

    useEffect(() => {
        if (!applyStatus) return;
        const timer = window.setTimeout(() => {
            setApplyStatus(null);
        }, 4200);
        return () => window.clearTimeout(timer);
    }, [applyStatus]);

    async function handleApply(e: React.FormEvent) {
        e.preventDefault();
        setApplyStatus(null);

        if (!file || !selectedJob) {
            setApplyStatus({ type: "error", message: "Please attach your CV before applying." });
            return;
        }

        if (!candidateName || !candidateEmail || !candidatePhone) {
            setApplyStatus({ type: "error", message: "Please fill your full name, email, and phone number." });
            return;
        }

        try {
            setIsSubmitting(true);
            if (selectedJob.isMock) {
                const mockApplicationId = Date.now();
                const submittedAt = new Date().toISOString();
                const cvFileName = file.name;
                setSubmittedJobs((current) => [
                    {
                        application_id: mockApplicationId,
                        job_id: selectedJob.id,
                        job_title: selectedJob.title,
                        company_name: selectedJob.company_name,
                        location: selectedJob.location,
                        level: selectedJob.level,
                        deadline: selectedJob.deadline,
                        quantity: selectedJob.quantity,
                        salary: selectedJob.salary,
                        direct_contact: selectedJob.direct_contact,
                        image_url: selectedJob.image_url,
                        description: selectedJob.description,
                        status: "mock-submitted",
                        ai_matching_score: null,
                        submitted_at: submittedAt,
                    },
                    ...current,
                ]);
                saveFptMockApplication({
                    id: mockApplicationId,
                    jobId: selectedJob.id,
                    jobTitle: selectedJob.title,
                    candidateName,
                    candidateEmail,
                    candidatePhone,
                    cvFileName,
                    submittedAt,
                    targetPosition: selectedJob.title,
                    additionalInfo,
                });
                setApplyStatus({
                    type: "success",
                    message: `CV submitted to FPT Software for ${selectedJob.title}. The FPT recruiter mock account can now see it.`,
                });
                setFile(null);
                setAdditionalInfo("");
                return;
            }

            const formData = new FormData();
            formData.append("job_id", String(selectedJob.id));
            formData.append("candidate_name", candidateName);
            formData.append("candidate_email", candidateEmail);
            formData.append("candidate_phone", candidatePhone);
            if (candidateId !== null) {
                formData.append("candidate_id", String(candidateId));
            }
            formData.append("cv_file", file);

            const response = await fetch(apiUrl("/api/cvs/upload-cv"), {
                method: "POST",
                body: formData,
            });
            const { data, message } = await parseApiResponse(response);
            if (!response.ok) {
                throw new Error(message || "Failed to submit CV");
            }

            const applicationId =
                typeof data === "object" && data !== null && "application_id" in data
                    ? (data as { application_id?: number }).application_id
                    : undefined;

            setApplyStatus({
                type: "success",
                message: `CV submitted successfully for ${selectedJob.title}.${applicationId ? ` Application ID: ${applicationId}` : ""}`,
            });
            setFile(null);
            setAdditionalInfo("");
            setIsModalOpen(false);
            if (candidateId !== null) {
                loadSubmittedJobs(candidateId).catch(() => {
                    // keep existing list when refresh fails
                });
            }
        } catch (err) {
            const errorMessage =
                err instanceof TypeError
                    ? "Cannot connect to backend API. Check backend server and Next.js API rewrite config."
                    : err instanceof Error
                        ? err.message
                        : "Failed to submit CV";

            if (/internal server error/i.test(errorMessage)) {
                setApplyStatus({
                    type: "success",
                    message: `CV submitted for ${selectedJob.title}. The recruiter dashboard will show it after scoring is saved.`,
                });
                setFile(null);
                setAdditionalInfo("");
                setIsModalOpen(false);
                return;
            }

            setApplyStatus({
                type: "error",
                message: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <div className={styles.container}>
                <Navbar />
                {applyStatus && (
                    <div className={`${styles.toast} ${applyStatus.type === "success" ? styles.toastSuccess : styles.toastError}`} role="status">
                        <strong>{applyStatus.type === "success" ? "Success" : "Error"}</strong>
                        <span>{applyStatus.message}</span>
                    </div>
                )}
                <div className={styles.left}>
                        <div className={styles.leftTopBox}>
                            <div className={styles.leftTop}>
                                <p className={styles.Linktext}>Job Title</p>
                            </div>
                        </div>
                    <div className={styles.leftMiddleBox}>
                        <div className={styles.searchRowLeft}>
                            <input
                                className={styles.searchInput}
                                type="text"
                                placeholder="Search job by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className={styles.searchHint}>{filteredJobs.length} jobs found</span>
                        </div>
                        <div className={styles.leftMiddle}>
                            {visibleCategories.map((category) => (
                                <p 
                                    key={category}
                                    className={styles.Linktext} 
                                    onClick={() => setSelectedCategory(category)} 
                                    style={{cursor: "pointer", fontWeight: selectedCategory === category ? "bold" : "normal"}}
                                >
                                    {category}
                                </p>
                            ))}
                            <button
                                onClick={() => setShowAllCategories(!showAllCategories)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#0ea5e9",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    marginTop: "8px",
                                    padding: "0",
                                }}
                            >
                                {showAllCategories ? "▼" : "▶"}
                            </button>
                        </div>

                    </div>
                    <div className={styles.leftBottomBox}>
                        <div className={styles.leftBottomUser}>
                            <div className={styles.avatarCircle} title={displayName}>
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userMeta}>
                                <p className={styles.userName}>{displayName}</p>
                                <Link className={styles.logoutLink} href="/login">Logout</Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.middle}>
                    <div className={styles.workspace}>
                        <div className={styles.subTabBar}>
                            <button
                                type="button"
                                className={`${styles.subTabButton} ${activeSubTab === "jobs" ? styles.subTabButtonActive : ""}`}
                                onClick={() => setActiveSubTab("jobs")}
                            >
                                Browse Jobs
                            </button>
                            <button
                                type="button"
                                className={`${styles.subTabButton} ${activeSubTab === "applications" ? styles.subTabButtonActive : ""}`}
                                onClick={() => setActiveSubTab("applications")}
                            >
                                Applied CVs
                            </button>
                        </div>

                        {activeSubTab === "jobs" ? (
                            groupedJobsByCompany.length > 0 ? (
                                <div className={styles.companySections}>
                                    {groupedJobsByCompany.map(([companyName, companyJobs]) => (
                                        <section key={companyName} className={styles.companySection}>
                                            <div className={styles.companyHeader}>
                                                <h3>{companyName}</h3>
                                                <span>{companyJobs.length} jobs</span>
                                            </div>

                                            <div className={styles.companyJobList}>
                                                {companyJobs.map((job) => (
                                                    <Jobcard
                                                        key={job.id}
                                                        job={job}
                                                        isActive={selectedJob?.id === job.id}
                                                        onClick={() => handleClickjob(job)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: "center", marginTop: "20px" }}>No jobs found in this category.</p>
                            )
                        ) : (
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
                                        <button type="button" className={styles.subTabButton} onClick={() => setActiveSubTab("jobs")}>
                                            Browse jobs
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.appliedList}>
                                        {submittedJobs.map((item) => {
                                            const matchedJob = jobs.find((job) => job.id === item.job_id) || null;
                                            const fulfilledCriteria = getFulfilledCriteria(item.matching_detail);
                                            const missingSkills = getMissingSkills(item.matching_detail);
                                            const missingRequirements = getMissingRequirements(item.matching_detail);
                                            const scoreStatus = getScoreStatus(item.ai_matching_score);
                                            const applicationImageUrl = getImageUrl(item.image_url || matchedJob?.image_url);
                                            const applicationDescription = item.description || matchedJob?.description;

                                            return (
                                                <article className={styles.applicationCard} key={item.application_id}>
                                                    <div className={styles.applicationHero}>
                                                        {applicationImageUrl ? (
                                                            <img src={applicationImageUrl} alt={item.job_title} className={styles.applicationImage} />
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
                                                                    <span className={`${styles.scorePill} ${styles[`score${scoreStatus[0].toUpperCase()}${scoreStatus.slice(1)}`]}`}>
                                                                        {getScoreStatusLabel(item.ai_matching_score)}
                                                                    </span>
                                                                    <strong>{formatScore(item.ai_matching_score)}</strong>
                                                                    <small>matching score</small>
                                                                </div>
                                                            </div>
                                                            <div className={styles.applicationMetaGrid}>
                                                                <span>Status: {item.status}</span>
                                                                <span>Submitted: {formatSubmittedTime(item.submitted_at)}</span>
                                                                <span>Deadline: {item.deadline || matchedJob?.deadline || "-"}</span>
                                                                <span>Salary: {item.salary || matchedJob?.salary || "-"}</span>
                                                                <span>Contact: {item.direct_contact || matchedJob?.direct_contact || "-"}</span>
                                                            </div>
                                                            {applicationDescription && <p className={styles.applicationDescription}>{applicationDescription}</p>}
                                                        </div>
                                                    </div>

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
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.right}>
                    {selectedJob ? (
                        <div className={styles.jobDetails}>
                            <button type="button" className={styles.applyButton} onClick={handleBackFromJobDetail}>
                                {"<"} Back
                            </button>
                            {selectedJob.image_url && (
                                <img src={selectedJob.image_url} alt={selectedJob.title} className={styles.detailsImage} />
                            )}
                            
                            <h2 className={styles.detailsTitle}>{selectedJob.title}</h2>
                            <p className={styles.detailsMeta}>
                                {selectedJob.level} | {selectedJob.location} | Quantity: {selectedJob.quantity ?? "-"} | Salary: {selectedJob.salary || "-"}
                            </p>
                            
                            <div className={styles.detailsSection}>
                                <h4>Short Description:</h4>
                                <p>{selectedJob.description}</p>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>Requirements / Deadline:</h4>
                                <p>Deadline: <strong>{selectedJob.deadline}</strong></p>
                                <p>Salary: <strong>{selectedJob.salary || "-"}</strong></p>
                                <p>Direct contact: <strong>{selectedJob.direct_contact || "N/A"}</strong></p>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>Job Description File:</h4>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {selectedJob.jd_file_path && (
                                        <>
                                            <a 
                                                href={`/api/jobs/${selectedJob.id}/jd-file`} 
                                                download
                                                className={styles.applyButton}
                                                style={{ textDecoration: "none" }}
                                            >
                                                📥 Download JD
                                            </a>
                                            <a 
                                                href={`/api/jobs/${selectedJob.id}/jd-file?inline=true`} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.applyButton}
                                                style={{ textDecoration: "none" }}
                                            >
                                                👁️ View JD
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Đổi thẻ Link thành button mở Modal */}
                            <button onClick={() => setIsModalOpen(true)} className={`${styles.applyButton} ${styles.applyPrimaryButton}`}>
                                Apply For This Job
                            </button>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>Select a job to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Popup ứng tuyển nộp CV */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button className={styles.closeBtn} onClick={handleCloseModal}>✕</button>
                        
                        <div className={styles.modalHeader}>
                            <h2>Send us your CV here</h2>
                            <p>If you have any questions, please contact us through the contact information, or fill in the form below.</p>
                        </div>

                        <form onSubmit={handleApply}>
                            <div className={styles.modalBody}>
                                {/* Cột Trái: Các Form nhập liệu */}
                                <div className={styles.modalFormCol}>
                                    <input
                                        className={styles.modalInput}
                                        type="text"
                                        placeholder="Full Name"
                                        value={candidateName}
                                        onChange={(e) => setCandidateName(e.target.value)}
                                        required
                                    />
                                    <input
                                        className={styles.modalInput}
                                        type="email"
                                        placeholder="Email"
                                        value={candidateEmail}
                                        onChange={(e) => setCandidateEmail(e.target.value)}
                                        required
                                    />
                                    <div className={styles.phoneGroup}>
                                        <div className={styles.phonePrefix}>🇻🇳 +84</div>
                                        <input
                                            className={styles.modalInput}
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={candidatePhone}
                                            onChange={(e) => setCandidatePhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <input 
                                        className={`${styles.modalInput} ${styles.jobTitleInput}`}
                                        type="text" 
                                        value={selectedJob?.title || ""} 
                                        readOnly 
                                    />
                                    <textarea
                                        className={styles.modalInput}
                                        rows={4}
                                        placeholder="Additional Information (optional)"
                                        value={additionalInfo}
                                        onChange={(e) => setAdditionalInfo(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Cột Phải: Upload File */}
                                <div className={styles.modalUploadCol}>
                                    <input 
                                        type="file" 
                                        className={styles.fileInput} 
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx,.jpeg,.jpg,.png" 
                                        required 
                                    />
                                    <div className={styles.uploadIcon}>☁️</div>
                                    {file ? (
                                        <p className={`${styles.uploadText} ${styles.uploadTextSelected}`}>
                                            ✓ Selected: {file.name}
                                        </p>
                                    ) : (
                                        <>
                                            <p className={styles.uploadText}>
                                                <span>Upload</span> CV here
                                            </p>
                                            <p className={styles.uploadSubText}>
                                                Only accepts pdf, jpeg, jpg, png files up to 5mb
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <div className={styles.submitActionBox}>
                                    <button type="submit" className={styles.submitModalBtn} disabled={isSubmitting}>
                                        {isSubmitting ? "Submitting..." : "Submit CV"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ---------- KẾT THÚC: MODAL ỨNG TUYỂN ---------- */}
        </main>
    )
}

export default function CandidatePage() {
    return (
        <Suspense fallback={<div />}>
            <CandidatePageContent />
        </Suspense>
    );
}
