"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

const VISIBLE_ACTIVITY_ACTIONS = new Set([
    "candidate.register",
    "candidate.cv.submit",
    "recruiter.job.upload",
    "admin.create.recruiter",
]);

export default function AdminDashboard() {
    const router = useRouter();
    const [adminId, setAdminId] = useState<number | null>(null);

    const [overview, setOverview] = useState<{ total_candidates: number; total_recruiters: number; total_jobs: number; total_applications: number } | null>(null);
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    useEffect(() => {
        const adminRaw = localStorage.getItem("adminUser");
        if (!adminRaw) {
            router.push("/admin/login");
            return;
        }

        const parsed = JSON.parse(adminRaw);
        if (parsed.role !== "admin") {
            router.push("/admin/login");
            return;
        }

        setAdminId(parsed.user_id);
    }, [router]);

    useEffect(() => {
        async function loadData() {
            if (!adminId) return;
            setLoading(true);
            try {
                const [overviewRes, jobsRes, activitiesRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/admin/overview?admin_id=${adminId}`),
                    fetch(`http://localhost:8000/api/admin/jobs?admin_id=${adminId}`),
                    fetch(`http://localhost:8000/api/admin/activities?admin_id=${adminId}&limit=20`),
                ]);
                const recruitersRes = await fetch(`http://localhost:8000/api/admin/recruiters?admin_id=${adminId}`);

                const overviewData = await overviewRes.json();
                const jobsData = await jobsRes.json();
                const activitiesData = await activitiesRes.json();
                const recruitersData = await recruitersRes.json();

                if (!overviewRes.ok || !jobsRes.ok || !activitiesRes.ok || !recruitersRes.ok) {
                    throw new Error("Unable to load admin data");
                }

                setOverview(overviewData);
                setJobs(Array.isArray(jobsData) ? jobsData : []);
                setActivities(Array.isArray(activitiesData) ? activitiesData : []);
                setRecruiters(Array.isArray(recruitersData) ? recruitersData : []);
            } catch (err) {
                setMessage(err instanceof Error ? err.message : "Failed to load data");
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [adminId]);

    const handleLogout = () => {
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
    };

    async function handleCreateRecruiter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!adminId) return;

        setMessage("");
        setMessageType("");

        try {
            const response = await fetch("http://localhost:8000/api/admin/recruiters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    admin_id: adminId,
                    email,
                    password,
                    company_name: companyName,
                    full_name: fullName,
                    phone,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to create recruiter");
            }

            setMessage("Recruiter created successfully");
            setMessageType("success");
            setEmail("");
            setPassword("");
            setCompanyName("");
            setFullName("");
            setPhone("");

            const [overviewRes, activitiesRes] = await Promise.all([
                fetch(`http://localhost:8000/api/admin/overview?admin_id=${adminId}`),
                fetch(`http://localhost:8000/api/admin/activities?admin_id=${adminId}&limit=20`),
            ]);
            setOverview(await overviewRes.json());
            setActivities(await activitiesRes.json());
            const recruitersRes = await fetch(`http://localhost:8000/api/admin/recruiters?admin_id=${adminId}`);
            setRecruiters(await recruitersRes.json());
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to create recruiter");
            setMessageType("error");
        }
    }

    async function handleDeleteJob(jobId: number) {
        if (!adminId) return;
        if (!confirm(`Confirm delete JD #${jobId}?`)) return;

        try {
            const response = await fetch(`http://localhost:8000/api/admin/jobs/${jobId}?admin_id=${adminId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to delete JD");
            }

            setJobs((prev) => prev.filter((j) => j.id !== jobId));
            setMessage("JD deleted successfully");
            setMessageType("success");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to delete JD");
            setMessageType("error");
        }
    }

    const visibleActivities = activities.filter((activity) =>
        VISIBLE_ACTIVITY_ACTIONS.has(activity.action)
    );

    function formatActivityTime(value: string) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    function getDisplayRole(activity: any) {
        if (activity.action === "admin.create.recruiter") {
            return "recruiter";
        }

        return activity.actor_role;
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <h2>Admin Panel</h2>
                </div>
                <nav className={styles.navMenu}>
                    <ul>
                        <li className={styles.active}>Dashboard</li>
                        <li>Recruiter Management</li>
                        <li>JD Management</li>
                        <li>Activity Logs</li>
                        <li onClick={handleLogout} className={styles.logoutItem}>🚪 Logout</li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Admin Operations</h1>
                </header>

                <main className={styles.contentArea}>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Candidates</h3>
                        <p>{overview?.total_candidates ?? "-"}</p>
                    </div>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Recruiters</h3>
                        <p>{overview?.total_recruiters ?? "-"}</p>
                    </div>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Jobs</h3>
                        <p>{overview?.total_jobs ?? "-"}</p>
                    </div>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Applications</h3>
                        <p>{overview?.total_applications ?? "-"}</p>
                    </div>

                    <div className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Create Recruiter Account</h3>
                        <form className={styles.createForm} onSubmit={handleCreateRecruiter}>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Recruiter email" required />
                            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" type="password" required />
                            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" required />
                            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Recruiter full name" />
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                            <button className={styles.primaryButton} type="submit">Create recruiter</button>
                        </form>
                    </div>

                    <div className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Recruiter Management</h3>
                        <div className={styles.recruiterGrid}>
                            {recruiters
                                .filter((recruiter) => typeof recruiter.company_name === "string" && recruiter.company_name.trim().length > 0)
                                .map((recruiter) => {
                                const companyInitial = recruiter.company_name.charAt(0).toUpperCase();

                                return (
                                    <article key={recruiter.id} className={styles.recruiterCard}>
                                        <div className={styles.recruiterAvatar}>{companyInitial}</div>
                                        <div className={styles.recruiterBody}>
                                            <h4>{recruiter.company_name}</h4>
                                            <p>{recruiter.full_name || "Recruiter account"}</p>
                                            <p>{recruiter.email}</p>
                                            <p>{recruiter.phone || "No phone"}</p>
                                            <span className={styles.recruiterBadge}>{recruiter.is_active ? "Active" : "Inactive"}</span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Jobs Uploaded By Recruiters</h3>
                        {loading ? <p>Loading...</p> : (
                            <div className={styles.tableWrap}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th align="left">ID</th>
                                        <th align="left">Title</th>
                                        <th align="left">Company</th>
                                        <th align="left">Recruiter</th>
                                        <th align="left">Applications</th>
                                        <th align="left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((j) => (
                                        <tr key={j.id}>
                                            <td>{j.id}</td>
                                            <td>{j.title}</td>
                                            <td>{j.company_name}</td>
                                            <td>{j.recruiter_email || "-"}</td>
                                            <td>{j.applications_count}</td>
                                            <td>
                                                    <button className={styles.dangerButton} onClick={() => handleDeleteJob(j.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                                </div>
                        )}
                    </div>

                        <div className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <h3>Recent Activity</h3>
                                {visibleActivities.length === 0 ? <p className={styles.emptyState}>No visible activity yet</p> : (
                                <ul className={styles.activityList}>
                                    {visibleActivities.map((a) => (
                                        <li key={a.id} className={styles.activityItem}>
                                            <div className={styles.activityMeta}>
                                                <span className={styles.activityTime}>{formatActivityTime(a.created_at)}</span>
                                                <span className={styles.activityRole}>[{getDisplayRole(a)}]</span>
                                            </div>
                                            <div className={styles.activityDetail}>{a.detail}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {message && (
                            <div className={`${styles.card} ${styles.messageBox} ${messageType === "success" ? styles.successBox : styles.errorBox}`} style={{ gridColumn: "1 / -1" }}>
                            {message}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
