"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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
};

type JobApplicationsResponse = {
    applications: Array<{
        application_id: number;
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

    const [jobs, setJobs] = useState<RecruiterJob[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [applications, setApplications] = useState<JobApplicationsResponse["applications"]>([]);
    const [cvLogs, setCvLogs] = useState<CVLogItem[]>([]);
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
        const res = await fetch(`http://localhost:8000/api/recruiter/${recruiterId}/jobs`);
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Failed to load recruiter jobs");
        }
        setJobs(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        if (!session) return;

        fetch(`http://localhost:8000/api/recruiter/${session.user_id}/profile`)
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

        fetch(`http://localhost:8000/api/recruiter/${session.user_id}/cv-logs`)
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

        fetch(`http://localhost:8000/api/recruiter/${session.user_id}/jobs/${selectedJobId}/applications`)
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
            const response = await fetch("http://localhost:8000/api/auth/login", {
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

            const res = await fetch("http://localhost:8000/api/jobs/upload-jd", {
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
            setCompanyName("");
            setLocation("");
            setLevel("Junior");
            setDeadline("");
            setQuantity(1);
            setDirectContact("");
            setDescription("");
            setJdFile(null);
            setIsUploadPopupOpen(false);

            await loadRecruiterJobs(session.user_id);
            const logsRes = await fetch(`http://localhost:8000/api/recruiter/${session.user_id}/cv-logs`);
            const logsData = await logsRes.json();
            if (logsRes.ok) {
                setCvLogs(Array.isArray(logsData) ? logsData : []);
            }
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Upload JD failed");
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
                                <button
                                    key={job.id}
                                    className={`${styles.jobBtn} ${selectedJobId === job.id ? styles.jobBtnActive : ""}`}
                                    onClick={() => setSelectedJobId(job.id)}
                                >
                                    #{job.id} {job.title} ({job.quantity ?? "-"})
                                </button>
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
                                        <tr key={log.log_id}>
                                            <td>{formatLogTime(log.created_at)}</td>
                                            <td>{log.job_title}</td>
                                            <td>{log.candidate_name || "-"}</td>
                                            <td>{log.candidate_email || "-"}</td>
                                            <td>{log.candidate_phone || "-"}</td>
                                            <td>{log.status}</td>
                                            <td>{log.ai_matching_score ?? "-"}</td>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map((app) => (
                                        <tr key={app.application_id}>
                                            <td>{app.candidate_name || "-"}</td>
                                            <td>{app.candidate_email || "-"}</td>
                                            <td>{app.candidate_phone || "-"}</td>
                                            <td>{app.status}</td>
                                            <td>{app.ai_matching_score ?? "-"}</td>
                                        </tr>
                                    ))}
                                    {applications.length === 0 && (
                                        <tr>
                                            <td colSpan={5}>No applications for selected job yet.</td>
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
                            </div>

                            <div className={styles.modalFooter}>
                                <button className={styles.button} type="submit">Create Job Card & Upload JD</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
