"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { apiUrl } from "@/utils/api";

type RecruiterSession = {
    user_id: number;
    role: string;
    email?: string;
    company_name?: string;
};

type RecruiterJob = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity?: number | null;
    direct_contact?: string | null;
    image_url?: string | null;
};

type JobApplicationsResponse = {
    applications: Array<{
        application_id: number;
        cv_id: number | null;
        candidate_name: string | null;
        candidate_email: string | null;
        candidate_phone: string | null;
        status: string;
        ai_matching_score: number | null;
    }>;
};

type CVLogItem = {
    log_id: number;
    created_at: string;
    job_id: number;
    job_title: string;
    application_id: number;
    cv_id: number | null;
    candidate_name: string | null;
    candidate_email: string | null;
    candidate_phone: string | null;
    status: string;
    ai_matching_score: number | null;
};

export default function RecruiterUIPage() {
    const [session, setSession] = useState<RecruiterSession | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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
    const [applications, setApplications] = useState<JobApplicationsResponse["applications"]>([]);
    const [cvLogs, setCvLogs] = useState<CVLogItem[]>([]);
    const [deleteConfirmApplicationId, setDeleteConfirmApplicationId] = useState<number | null>(null);
    const [selectedLog, setSelectedLog] = useState<CVLogItem | null>(null);
    const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    useEffect(() => {
        const saved = localStorage.getItem("recruiterUser");
        const savedTheme = localStorage.getItem("recruiterTheme");
        if (savedTheme === "light" || savedTheme === "dark") {
            setTheme(savedTheme);
        }
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved) as RecruiterSession;
            if (parsed.role === "recruiter") {
                setSession(parsed);
            }
        } catch {
            localStorage.removeItem("recruiterUser");
        }
    }, []);

    async function loadRecruiterJobs(recruiterId: number) {
        const res = await fetch(apiUrl(`/api/recruiter/${recruiterId}/jobs`));
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Failed to load recruiter jobs");
        }
        setJobs(Array.isArray(data) ? data : []);
    }

    async function reloadRecruiterData(recruiterId: number, keepCurrentSelection = true) {
        await loadRecruiterJobs(recruiterId);

        const logsRes = await fetch(apiUrl(`/api/recruiter/${recruiterId}/cv-logs`));
        const logsData = await logsRes.json();
        if (!logsRes.ok) {
            throw new Error(logsData.detail || "Failed to load CV logs");
        }
        const logs = Array.isArray(logsData) ? logsData : [];
        setCvLogs(logs);

        if (keepCurrentSelection && selectedJobId) {
            const appsRes = await fetch(apiUrl(`/api/recruiter/${recruiterId}/jobs/${selectedJobId}/applications`));
            const appsData = await appsRes.json();
            if (!appsRes.ok) {
                throw new Error(appsData.detail || "Failed to load applications");
            }
            setApplications(Array.isArray(appsData.applications) ? appsData.applications : []);
        }
    }

    useEffect(() => {
        if (!session) return;

        fetch(apiUrl(`/api/recruiter/${session.user_id}/profile`))
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Failed to load recruiter profile");
                }

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
                    localStorage.setItem("recruiterUser", JSON.stringify(mergedSession));
                }
            })
            .catch(() => {
                setCompanyName(session.company_name || "");
            });

        loadRecruiterJobs(session.user_id).catch((err) => {
            setMessage(err instanceof Error ? err.message : "Failed to load jobs");
            setMessageType("error");
        });

        fetch(apiUrl(`/api/recruiter/${session.user_id}/cv-logs`))
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Failed to load CV logs");
                }
                setCvLogs(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                setMessage(err instanceof Error ? err.message : "Failed to load CV logs");
                setMessageType("error");
            });
    }, [session]);

    useEffect(() => {
        if (!session || !selectedJobId) {
            setApplications([]);
            return;
        }

        fetch(apiUrl(`/api/recruiter/${session.user_id}/jobs/${selectedJobId}/applications`))
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Failed to load applications");
                }
                setApplications(Array.isArray(data.applications) ? data.applications : []);
            })
            .catch((err) => {
                setMessage(err instanceof Error ? err.message : "Failed to load applications");
                setMessageType("error");
            });
    }, [session, selectedJobId]);

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(apiUrl("/api/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed");
            }
            if (data.role !== "recruiter") {
                throw new Error("This account is not recruiter");
            }

            const recruiterSession = {
                user_id: data.user_id,
                role: data.role,
                email: data.email || email,
                company_name: data.company_name,
            };
            localStorage.setItem("recruiterUser", JSON.stringify(recruiterSession));
            setSession(recruiterSession);
            setCompanyName(data.company_name || "");
            setMessage("Recruiter login successful");
            setMessageType("success");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Cannot login");
            setMessageType("error");
        }
    }

    function handleLogout() {
        localStorage.removeItem("recruiterUser");
        setSession(null);
        setSelectedJobId(null);
        setApplications([]);
        setCvLogs([]);
        setIsUploadPopupOpen(false);
        setMessage("Logged out");
        setMessageType("success");
    }

    function handleToggleTheme() {
        const nextTheme = theme === "light" ? "dark" : "light";
        setTheme(nextTheme);
        localStorage.setItem("recruiterTheme", nextTheme);
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
            const formData = new FormData();
            formData.append("recruiter_id", String(session.user_id));
            formData.append("title", title);
            formData.append("location", location);
            formData.append("level", level);
            formData.append("deadline", deadline);
            formData.append("quantity", String(quantity));
            formData.append("direct_contact", directContact);
            formData.append("description", description);
            formData.append("jd_file", jdFile);
            if (coverImageFile) {
                formData.append("cover_image", coverImageFile);
            }

            const res = await fetch(apiUrl("/api/jobs/upload-jd"), {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Upload JD failed");
            }

            setMessage("JD uploaded successfully");
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
            const logsRes = await fetch(apiUrl(`/api/recruiter/${session.user_id}/cv-logs`));
            const logsData = await logsRes.json();
            if (logsRes.ok) {
                setCvLogs(Array.isArray(logsData) ? logsData : []);
            }
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Upload JD failed");
            setMessageType("error");
        }
    }

    async function handleDeleteJob(jobId: number) {
        if (!session) return;
        if (!window.confirm(`Delete JD #${jobId}?`)) return;

        try {
            const res = await fetch(apiUrl(`/api/recruiter/${session.user_id}/jobs/${jobId}`), {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Delete JD failed");
            }

            setMessage("JD deleted successfully");
            setMessageType("success");

            if (selectedJobId === jobId) {
                setSelectedJobId(null);
            }

            await loadRecruiterJobs(session.user_id);

            const logsRes = await fetch(apiUrl(`/api/recruiter/${session.user_id}/cv-logs`));
            const logsData = await logsRes.json();
            if (logsRes.ok) {
                setCvLogs(Array.isArray(logsData) ? logsData : []);
            }
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Delete JD failed");
            setMessageType("error");
        }
    }

    async function handleDeleteApplication(applicationId: number) {
        if (!session) return;
        try {
            const res = await fetch(apiUrl(`/api/recruiter/${session.user_id}/applications/${applicationId}`), {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Delete CV failed");
            }

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
        () => jobs.find((job) => job.id === selectedJobId) || null,
        [jobs, selectedJobId]
    );

    const totalApplications = useMemo(
        () => cvLogs.length,
        [cvLogs]
    );

    const pendingApplications = useMemo(
        () => cvLogs.filter((log) => log.status === "pending").length,
        [cvLogs]
    );

    const reviewedApplications = useMemo(
        () => cvLogs.filter((log) => log.status !== "pending").length,
        [cvLogs]
    );

    const filteredLogs = useMemo(() => {
        if (!selectedJobId) return cvLogs;
        return cvLogs.filter((log) => log.job_id === selectedJobId);
    }, [cvLogs, selectedJobId]);

    const companyLabel = useMemo(() => {
        const fromSession = session?.company_name;
        if (fromSession && fromSession.trim()) return fromSession;
        const fromSelected = selectedJob?.company_name;
        if (fromSelected && fromSelected.trim()) return fromSelected;
        const fromJob = jobs[0]?.company_name;
        if (fromJob && fromJob.trim()) return fromJob;
        const fromEmail = session?.email;
        if (fromEmail && fromEmail.includes("@")) return fromEmail.split("@")[0];
        return "Recruiter";
    }, [jobs, selectedJob, session]);

    function formatLogTime(value: string) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    function formatScore(value: number | null) {
        if (value === null || Number.isNaN(value)) return "-";
        return value.toFixed(3);
    }

    if (!session) {
        return (
            <div className={`${styles.page} ${styles.loginPage} ${theme === "light" ? styles.themeLight : styles.themeDark}`}>
                <div className={`${styles.card} ${styles.loginWrap}`}>
                    <div className={styles.loginHeader}>
                        <p className={styles.loginEyebrow}>Recruiter Workspace</p>
                        <h1 className={styles.title}>Recruiter Login</h1>
                        <p className={styles.subtleText}>Sign in to upload JD, create job cards, and track candidate submissions.</p>
                    </div>
                    <form className={styles.loginForm} onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Recruiter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button className={styles.button} type="submit">Login</button>
                    </form>
                    {message && (
                        <p className={`${styles.message} ${messageType === "success" ? styles.success : styles.error}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.dashboardContainer} ${theme === "light" ? styles.themeLight : styles.themeDark}`}>
            <aside className={styles.sidebar}>
                <div className={styles.logoBox}>
                    <div className={styles.avatar}>{companyLabel.charAt(0).toUpperCase()}</div>
                    <h2>{companyLabel}</h2>
                    <p>{session.email || "Recruiter account"}</p>
                </div>

                <div className={styles.navMenu}>
                    <button className={`${styles.navButton} ${styles.navButtonPrimary}`} onClick={() => setIsUploadPopupOpen(true)}>
                        Create JD
                    </button>
                    <button className={styles.navButton} onClick={handleToggleTheme}>
                        Switch to {theme === "light" ? "Dark" : "Light"}
                    </button>
                    <button className={`${styles.navButton} ${styles.logoutButton}`} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Recruiter Dashboard</h1>
                    <p>Manage JD posts and track CV submissions in real time.</p>
                </header>

                <main className={styles.contentArea}>
                    <article className={`${styles.card} ${styles.statCard}`}>
                        <h3>Total Jobs</h3>
                        <p>{jobs.length}</p>
                    </article>
                    <article className={`${styles.card} ${styles.statCard}`}>
                        <h3>Total Applications</h3>
                        <p>{totalApplications}</p>
                    </article>
                    <article className={`${styles.card} ${styles.statCard}`}>
                        <h3>Pending</h3>
                        <p>{pendingApplications}</p>
                    </article>
                    <article className={`${styles.card} ${styles.statCard}`}>
                        <h3>Reviewed</h3>
                        <p>{reviewedApplications}</p>
                    </article>

                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Manage Uploaded Jobs</h3>
                        <p className={styles.subtleText}>Select a job to filter logs and application status.</p>
                        <div className={styles.jobs}>
                            {jobs.map((job) => (
                                <div key={job.id} className={styles.jobItemWrap}>
                                    <button
                                        className={`${styles.jobBtn} ${selectedJobId === job.id ? styles.jobBtnActive : ""}`}
                                        onClick={() => setSelectedJobId(job.id)}
                                    >
                                        #{job.id} {job.title} ({job.quantity ?? "-"})
                                    </button>
                                    <button
                                        className={styles.jobDeleteXBtn}
                                        onClick={() => handleDeleteJob(job.id)}
                                        title="Delete this job"
                                        aria-label={`Delete job ${job.title}`}
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                            {jobs.length === 0 && <p>No JD uploaded yet.</p>}
                        </div>
                    </section>

                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>CV Upload Logs {selectedJob ? `for: ${selectedJob.title}` : "(All jobs)"}</h3>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Job</th>
                                        <th>Candidate</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.log_id} className={styles.clickableRow} onClick={() => setSelectedLog(log)}>
                                            <td>{formatLogTime(log.created_at)}</td>
                                            <td>{log.job_title}</td>
                                            <td>{log.candidate_name || "-"}</td>
                                            <td>{log.candidate_email || "-"}</td>
                                            <td>{log.candidate_phone || "-"}</td>
                                            <td>{log.status}</td>
                                            <td>{formatScore(log.ai_matching_score)}</td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={7}>No CV uploads logged yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

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
                                    {applications.map((app) => (
                                        <tr key={app.application_id}>
                                            <td>{app.candidate_name || "-"}</td>
                                            <td>{app.candidate_email || "-"}</td>
                                            <td>{app.candidate_phone || "-"}</td>
                                            <td>{app.status}</td>
                                            <td>{formatScore(app.ai_matching_score)}</td>
                                            <td>
                                                {deleteConfirmApplicationId === app.application_id ? (
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
                                    {applications.length === 0 && (
                                        <tr>
                                            <td colSpan={6}>No applications for selected job yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {message && (
                        <p className={`${styles.message} ${messageType === "success" ? styles.success : styles.error}`}>
                            {message}
                        </p>
                    )}
                </main>
            </div>

            {isUploadPopupOpen && (
                <div className={styles.popupOverlay}>
                    <div className={styles.popupCard}>
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

                            <div className={styles.modalFooter}>
                                <button className={styles.button} type="submit">Create Job Card & Upload JD</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedLog && session && (
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
                                <p className={styles.contactLabel}>Status</p>
                                <p className={styles.contactValue}>{selectedLog.status}</p>
                            </div>
                            <div className={styles.contactItem}>
                                <p className={styles.contactLabel}>Score</p>
                                <p className={styles.contactValue}>{formatScore(selectedLog.ai_matching_score)}</p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <a
                                className={styles.button}
                                href={apiUrl(`/api/recruiter/${session.user_id}/applications/${selectedLog.application_id}/cv-file?inline=true`)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View CV in Browser
                            </a>
                            <a
                                className={styles.navButton}
                                href={apiUrl(`/api/recruiter/${session.user_id}/applications/${selectedLog.application_id}/cv-file`)}
                            >
                                Download CV
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
