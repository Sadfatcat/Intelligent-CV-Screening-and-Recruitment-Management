"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar_candidate";
import { apiUrl } from "@/utils/api";
import { useCandidateData } from "./hooks/useCandidateData";
import AppliedCVsPage from "./pages/AppliedCVsPage";
import JobBrowsePage from "./pages/JobBrowsePage";
import type { JobItem } from "./hooks/useCandidateData";
import { normalizeJobImageUrl } from "./utils/candidateJobAssets";
import styles from "../../app/candidate/page.module.css";

const ALL_CATEGORIES = [
    "All Jobs", "FrontEnd", "BackEnd", "Full Stack", "Mobile Developer",
    "DevOps/Cloud", "QA/Testing", "AI/ML", "Data Scientist", "Data Analyst",
    "Big Data Engineer", "Database Admin", "System Admin", "Cybersecurity",
    "UI/UX Designer", "Software Architect", "Engineering Manager",
    "Business Analyst", "Technical Writer",
];

const DEMO_ROUTES = [
    { label: "Admin", href: "/admin/dashboard" },
    { label: "Recruiter", href: "/recruiter_UI" },
    { label: "Candidate", href: "/candidate" },
];

export default function CandidateLayout() {
    const {
        candidateId,
        displayName,
        candidateEmail,
        setCandidateEmail,
        jobs,
        submittedJobs,
        setSubmittedJobs,
        isCvScoring,
        setIsCvScoring,
        hasScoringApplication,
        applyStatus,
        setApplyStatus,
        loadSubmittedJobs,
        parseApiResponse,
        saveFintMockApplication,
    } = useCandidateData();

    const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All Jobs");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<"jobs" | "applications">("jobs");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJobImageFailed, setSelectedJobImageFailed] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [candidateName, setCandidateName] = useState("");
    const [candidatePhone, setCandidatePhone] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const candidateJobDetailHistoryRef = useRef(false);

    const isCandidateLocked = isSubmitting || isCvScoring || hasScoringApplication;

    useEffect(() => {
        if ((isCvScoring || hasScoringApplication) && activeSubTab !== "applications") {
            setActiveSubTab("applications");
        }
    }, [activeSubTab, hasScoringApplication, isCvScoring]);

    useEffect(() => {
        if (!applyStatus) return;
        const timer = window.setTimeout(() => setApplyStatus(null), 4200);
        return () => window.clearTimeout(timer);
    }, [applyStatus, setApplyStatus]);

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

    const visibleCategories = showAllCategories ? ALL_CATEGORIES : ALL_CATEGORIES.slice(0, 6);

    const filteredJobs = useMemo(() => {
        const byCategory = selectedCategory === "All Jobs"
            ? jobs
            : jobs.filter((job) => job.title.includes(selectedCategory));
        const q = searchQuery.trim().toLowerCase();
        if (!q) return byCategory;
        return byCategory.filter((job) => job.title.toLowerCase().includes(q));
    }, [selectedCategory, searchQuery, jobs]);

    const groupedJobsByCompany = useMemo(() => {
        const grouped = filteredJobs.reduce<Record<string, JobItem[]>>((acc, job) => {
            const company = (job.company_name || "Unknown Company").trim() || "Unknown Company";
            if (!acc[company]) acc[company] = [];
            acc[company].push(job);
            return acc;
        }, {});
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredJobs]);

    function notifyLocked() {
        setApplyStatus({ type: "error", message: "Your CV is being scored, please wait." });
        setActiveSubTab("applications");
    }

    function handleSelectJob(jobData: JobItem) {
        if (isCandidateLocked) { notifyLocked(); return; }
        if (typeof window !== "undefined" && !candidateJobDetailHistoryRef.current) {
            window.history.pushState({ ...(window.history.state ?? {}), intelliCvCandidateJobDetail: true }, "", window.location.href);
            candidateJobDetailHistoryRef.current = true;
        }
        setSelectedJob(jobData);
        setSelectedJobImageFailed(false);
        if (jobData.isMock) setIsModalOpen(true);
        if (!jobData.isMock) {
            fetch(apiUrl(`/api/jobs/${jobData.id}`))
                .then(async (response) => {
                    if (!response.ok) return null;
                    return await response.json() as Pick<JobItem, "jd_parsed_text">;
                })
                .then((detail) => {
                    if (!detail?.jd_parsed_text) return;
                    setSelectedJob((current) => current?.id === jobData.id ? { ...current, jd_parsed_text: detail.jd_parsed_text } : current);
                })
                .catch(() => {});
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

    function handleCloseModal() {
        setIsModalOpen(false);
        setFile(null);
        setAdditionalInfo("");
        setApplyStatus(null);
    }

    function openDemoRoute(path: string) {
        window.open(path, "_blank", "noopener,noreferrer");
    }

    async function handleApply(e: React.FormEvent) {
        e.preventDefault();
        setApplyStatus(null);
        if (isCandidateLocked) {
            setApplyStatus({ type: "error", message: "Please wait until the current CV scoring is finished." });
            return;
        }
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
                saveFintMockApplication({
                    id: mockApplicationId,
                    jobId: selectedJob.id,
                    jobTitle: selectedJob.title,
                    candidateName,
                    candidateEmail,
                    candidatePhone,
                    cvFileName: file.name,
                    submittedAt,
                    targetPosition: selectedJob.title,
                    additionalInfo,
                });
                setApplyStatus({
                    type: "success",
                    message: `CV submitted to Fint Vietnam for ${selectedJob.title}. The Fint recruiter mock account can now see it.`,
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
            if (candidateId !== null) formData.append("candidate_id", String(candidateId));
            formData.append("cv_file", file);

            const response = await fetch(apiUrl("/api/cvs/upload-cv"), { method: "POST", body: formData });
            const { data, message } = await parseApiResponse(response);
            if (!response.ok) throw new Error(message || "Failed to submit CV");

            const applicationId =
                typeof data === "object" && data !== null && "application_id" in data
                    ? (data as { application_id?: number }).application_id
                    : undefined;

            setIsCvScoring(candidateId !== null);
            setApplyStatus({
                type: "success",
                message: `Your CV is being scored, please wait.${applicationId ? ` Application ID: ${applicationId}` : ""}`,
            });
            setFile(null);
            setAdditionalInfo("");
            setIsModalOpen(false);
            setActiveSubTab("applications");
            if (candidateId !== null) loadSubmittedJobs(candidateId).catch(() => {});
        } catch (err) {
            const msg =
                err instanceof TypeError
                    ? "Cannot connect to backend API."
                    : err instanceof Error ? err.message : "Failed to submit CV";

            if (/internal server error/i.test(msg)) {
                setApplyStatus({ type: "success", message: "Your CV is being scored, please wait." });
                setFile(null);
                setAdditionalInfo("");
                setIsModalOpen(false);
                setActiveSubTab("applications");
                return;
            }
            setApplyStatus({ type: "error", message: msg });
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

                {/* Left sidebar */}
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
                                disabled={isCandidateLocked}
                            />
                            <span className={styles.searchHint}>{filteredJobs.length} jobs found</span>
                        </div>
                        <div className={styles.leftMiddle}>
                            {visibleCategories.map((category) => (
                                <p
                                    key={category}
                                    className={styles.Linktext}
                                    onClick={() => {
                                        if (isCandidateLocked) { notifyLocked(); return; }
                                        setSelectedCategory(category);
                                    }}
                                    style={{
                                        cursor: isCandidateLocked ? "not-allowed" : "pointer",
                                        fontWeight: selectedCategory === category ? "bold" : "normal",
                                        opacity: isCandidateLocked ? 0.58 : 1,
                                    }}
                                >
                                    {category}
                                </p>
                            ))}
                            <button
                                onClick={() => {
                                    if (isCandidateLocked) { notifyLocked(); return; }
                                    setShowAllCategories(!showAllCategories);
                                }}
                                disabled={isCandidateLocked}
                                style={{ background: "none", border: "none", color: "#0ea5e9", cursor: isCandidateLocked ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", marginTop: "8px", padding: "0", opacity: isCandidateLocked ? 0.58 : 1 }}
                            >
                                {showAllCategories ? "▼" : "▶"}
                            </button>
                        </div>
                    </div>
                    <div className={styles.leftBottomBox}>
                        <div className={styles.quickSwapBox}>
                            {DEMO_ROUTES.map((route) => (
                                <button key={route.href} type="button" className={styles.quickSwapButton} onClick={() => openDemoRoute(route.href)}>
                                    {route.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.leftBottomUser}>
                            <div className={styles.avatarCircle} title={displayName}>
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userMeta}>
                                <p className={styles.userName}>{displayName}</p>
                                <Link className={styles.settingLink} href="/candidate/settings">Settings</Link>
                                <Link className={styles.logoutLink} href="/login">Logout</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle — active page */}
                <div className={styles.middle}>
                    <div className={styles.workspace}>
                        <div className={styles.subTabBar}>
                            <button
                                type="button"
                                className={`${styles.subTabButton} ${activeSubTab === "jobs" ? styles.subTabButtonActive : ""}`}
                                onClick={() => {
                                    if (isCandidateLocked) { notifyLocked(); return; }
                                    setActiveSubTab("jobs");
                                }}
                                disabled={isCandidateLocked}
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
                            <JobBrowsePage
                                groupedJobsByCompany={groupedJobsByCompany}
                                selectedJobId={selectedJob?.id}
                                onSelectJob={handleSelectJob}
                            />
                        ) : (
                            <AppliedCVsPage
                                submittedJobs={submittedJobs}
                                jobs={jobs}
                                isCvScoring={isCvScoring}
                                hasScoringApplication={hasScoringApplication}
                                onBrowseJobs={() => setActiveSubTab("jobs")}
                            />
                        )}
                    </div>
                </div>

                {/* Right — job detail */}
                <div className={styles.right}>
                    {selectedJob ? (
                        <div className={styles.jobDetails}>
                            <button type="button" className={styles.applyButton} onClick={handleBackFromJobDetail}>
                                {"<"} Back
                            </button>
                            {normalizeJobImageUrl(selectedJob.image_url) && !selectedJobImageFailed ? (
                                <img src={normalizeJobImageUrl(selectedJob.image_url)} alt={selectedJob.title} className={styles.detailsImage} onError={() => setSelectedJobImageFailed(true)} />
                            ) : (
                                <div className={styles.detailsImageFallback}>{selectedJob.company_name.charAt(0).toUpperCase()}</div>
                            )}
                            <h2 className={styles.detailsTitle}>{selectedJob.title}</h2>
                            <p className={styles.detailsMeta}>
                                {selectedJob.level} | {selectedJob.location} | Quantity: {selectedJob.quantity ?? "-"} | Salary: {selectedJob.salary || "-"}
                            </p>
                            <div className={styles.detailsSection}>
                                <h4>Short Description:</h4>
                                <p>{selectedJob.description}</p>
                            </div>
                            {(selectedJob.requirements || selectedJob.jd_parsed_text) && (
                                <div className={`${styles.detailsSection} ${styles.detailsRequirementSection}`}>
                                    <h4>Requirements:</h4>
                                    <p>{selectedJob.requirements || selectedJob.jd_parsed_text}</p>
                                </div>
                            )}
                            <div className={styles.detailsSection}>
                                <h4>Requirements / Deadline:</h4>
                                <p>Deadline: <strong>{selectedJob.deadline}</strong></p>
                                <p>Salary: <strong>{selectedJob.salary || "-"}</strong></p>
                                <p>Direct contact: <strong>{selectedJob.direct_contact || "N/A"}</strong></p>
                            </div>
                            {selectedJob.jd_file_path && (
                                <div className={styles.detailsSection}>
                                    <h4>Job Description File:</h4>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <a href={`/api/jobs/${selectedJob.id}/jd-file`} download className={styles.applyButton} style={{ textDecoration: "none" }}>
                                            📥 Download JD
                                        </a>
                                        <a href={`/api/jobs/${selectedJob.id}/jd-file?inline=true`} target="_blank" rel="noopener noreferrer" className={styles.applyButton} style={{ textDecoration: "none" }}>
                                            👁️ View JD
                                        </a>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    if (isCandidateLocked) {
                                        setApplyStatus({ type: "error", message: "Your CV is being scored, please wait." });
                                        setActiveSubTab("applications");
                                        return;
                                    }
                                    setIsModalOpen(true);
                                }}
                                className={`${styles.applyButton} ${styles.applyPrimaryButton}`}
                                disabled={isCandidateLocked}
                                type="button"
                            >
                                {isCandidateLocked ? "Scoring in progress..." : "Apply For This Job"}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>Select a job to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Apply modal */}
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
                                <div className={styles.modalFormCol}>
                                    <input className={styles.modalInput} type="text" placeholder="Full Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} disabled={isCandidateLocked} required />
                                    <input className={styles.modalInput} type="email" placeholder="Email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} disabled={isCandidateLocked} required />
                                    <div className={styles.phoneGroup}>
                                        <div className={styles.phonePrefix}>🇻🇳 +84</div>
                                        <input className={styles.modalInput} type="tel" placeholder="Phone Number" value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} disabled={isCandidateLocked} required />
                                    </div>
                                    <input className={`${styles.modalInput} ${styles.jobTitleInput}`} type="text" value={selectedJob?.title || ""} readOnly />
                                    <textarea className={styles.modalInput} rows={4} placeholder="Additional Information (optional)" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} disabled={isCandidateLocked} />
                                </div>
                                <div className={styles.modalUploadCol}>
                                    <input type="file" className={styles.fileInput} onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} accept=".pdf,.docx,.jpeg,.jpg,.png" disabled={isCandidateLocked} required />
                                    <div className={styles.uploadIcon}>☁️</div>
                                    {file ? (
                                        <p className={`${styles.uploadText} ${styles.uploadTextSelected}`}>✓ Selected: {file.name}</p>
                                    ) : (
                                        <>
                                            <p className={styles.uploadText}><span>Upload</span> CV here</p>
                                            <p className={styles.uploadSubText}>Only accepts pdf, jpeg, jpg, png files up to 5mb</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <div className={styles.submitActionBox}>
                                    <button type="submit" className={styles.submitModalBtn} disabled={isCandidateLocked}>
                                        {isSubmitting ? "Submitting..." : isCandidateLocked ? "Scoring in progress..." : "Submit CV"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
