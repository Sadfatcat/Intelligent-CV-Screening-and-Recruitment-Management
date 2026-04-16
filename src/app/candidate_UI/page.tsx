"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import brightStyles from "./page.bright.module.css";
import darkStyles from "./page.dark.module.css";
// import { handleLoginSubmit } from "@/utils/loginHandler";
// import Image from "next/image";
import Navbar from "@/components/navbar/Navbar_candidate";
import Jobcard from "@/components/Jobcard";

type JobItem = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity?: number | null;
    direct_contact?: string | null;
    image_url?: string;
    description: string;
    requirements?: string;
    jd_file_path?: string | null;
};

type CandidateSubmissionItem = {
    application_id: number;
    job_id: number;
    job_title: string;
    company_name: string;
    location: string;
    level: string;
    status: string;
    ai_matching_score: number | null;
    submitted_at: string | null;
};

export default function CandidatePage() {
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

    function formatScore(value: number | null) {
        if (value === null || Number.isNaN(value)) return "-";
        return value.toFixed(3);
    }

    async function loadSubmittedJobs(candidateIdValue: number) {
        const response = await fetch(`/api/cvs/candidate/${candidateIdValue}/applications`);
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
        fetch("/api/jobs/")
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
                setJobs(normalizedJobs);
            })
            .catch(() => {
                setJobs([]);
            });
    }, []);

    // onClick cho job cards
    const handleClickjob = (jobData: JobItem) => {
        setSelectedJob(jobData);
        console.log("Selected Job:", jobData.title);
    }

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
            const formData = new FormData();
            formData.append("job_id", String(selectedJob.id));
            formData.append("candidate_name", candidateName);
            formData.append("candidate_email", candidateEmail);
            formData.append("candidate_phone", candidatePhone);
            if (candidateId !== null) {
                formData.append("candidate_id", String(candidateId));
            }
            formData.append("cv_file", file);

            const response = await fetch("/api/cvs/upload-cv", {
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
            if (candidateId !== null) {
                loadSubmittedJobs(candidateId).catch(() => {
                    // keep existing list when refresh fails
                });
            }
        } catch (err) {
            setApplyStatus({
                type: "error",
                message:
                    err instanceof TypeError
                        ? "Cannot connect to backend API. Check backend server and Next.js API rewrite config."
                        : err instanceof Error
                            ? err.message
                            : "Failed to submit CV",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <div className={styles.container}>
                <Navbar />
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

                        {candidateId !== null && (
                            <div className={styles.submittedJobsCard}>
                                <h4 className={styles.submittedJobsTitle}>Submitted CV Jobs</h4>
                                {submittedJobs.length === 0 ? (
                                    <p className={styles.submittedJobsEmpty}>You have not submitted any CV yet.</p>
                                ) : (
                                    <ul className={styles.submittedJobsList}>
                                        {submittedJobs.map((item) => (
                                            <li key={item.application_id}>
                                                <button
                                                    type="button"
                                                    className={styles.submittedJobItem}
                                                    onClick={() => {
                                                        const matchedJob = jobs.find((job) => job.id === item.job_id) || null;
                                                        setSelectedJob(matchedJob);
                                                    }}
                                                >
                                                    <span className={styles.submittedJobTitle}>{item.job_title}</span>
                                                    <span className={styles.submittedJobMeta}>{item.company_name} | {item.level}</span>
                                                    <span className={styles.submittedJobMeta}>Status: {item.status}</span>
                                                    <span className={styles.submittedJobMeta}>Score: {formatScore(item.ai_matching_score)}</span>
                                                    <span className={styles.submittedJobMeta}>Submitted: {formatSubmittedTime(item.submitted_at)}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
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
                    {groupedJobsByCompany.length > 0 ? (
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
                    )}
                </div>

                <div className={styles.right}>
                    {selectedJob ? (
                        <div className={styles.jobDetails}>
                            {selectedJob.image_url && (
                                <img src={selectedJob.image_url} alt={selectedJob.title} className={styles.detailsImage} />
                            )}
                            
                            <h2 className={styles.detailsTitle}>{selectedJob.title}</h2>
                            <p className={styles.detailsMeta}>
                                {selectedJob.level} | {selectedJob.location} | Quantity: {selectedJob.quantity ?? "-"}
                            </p>
                            
                            <div className={styles.detailsSection}>
                                <h4>Short Description:</h4>
                                <p>{selectedJob.description}</p>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>Requirements / Deadline:</h4>
                                <p>Deadline: <strong>{selectedJob.deadline}</strong></p>
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
                                        className={styles.modalInput} 
                                        type="text" 
                                        value={selectedJob?.title || ""} 
                                        readOnly 
                                        style={{ background: "#f9f9f9", opacity : 0.8}} 
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
                                        <p className={styles.uploadText} style={{ color: "green" }}>
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
                                {applyStatus && (
                                    <p className={`${styles.submitStatus} ${applyStatus.type === "success" ? styles.submitStatusSuccess : styles.submitStatusError}`}>
                                        {applyStatus.message}
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ---------- KẾT THÚC: MODAL ỨNG TUYỂN ---------- */}
        </main>
    )
}
