"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogoIcon from "@/components/brand/BrandLogoIcon";
import { apiUrl } from "@/utils/api";
import styles from "../dashboard/dashboard.module.css";

type RecruiterAccount = {
    id: number;
    email: string;
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    is_active: boolean;
};

export default function AdminRecruitersPage() {
    const router = useRouter();
    const [adminId, setAdminId] = useState<number | null>(null);
    const [recruiters, setRecruiters] = useState<RecruiterAccount[]>([]);
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
            router.push("/login");
            return;
        }

        const parsed = JSON.parse(adminRaw);
        if (parsed.role !== "admin") {
            router.push("/login");
            return;
        }

        window.setTimeout(() => setAdminId(parsed.user_id), 0);
    }, [router]);

    useEffect(() => {
        if (!adminId) return;
        const timer = window.setTimeout(() => {
            setLoading(true);
            fetch(apiUrl(`/api/admin/recruiters?admin_id=${adminId}`))
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.detail || "Failed to load recruiters");
                    }
                    setRecruiters(Array.isArray(data) ? data : []);
                    setMessage("");
                    setMessageType("");
                })
                .catch((err) => {
                    setMessage(err instanceof Error ? err.message : "Failed to load recruiters");
                    setMessageType("error");
                })
                .finally(() => setLoading(false));
        }, 0);

        return () => window.clearTimeout(timer);
    }, [adminId]);

    async function handleCreateRecruiter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!adminId) return;

        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(apiUrl("/api/admin/recruiters"), {
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

            const recruitersResponse = await fetch(apiUrl(`/api/admin/recruiters?admin_id=${adminId}`));
            const recruitersData = await recruitersResponse.json();
            setRecruiters(Array.isArray(recruitersData) ? recruitersData : []);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to create recruiter");
            setMessageType("error");
        }
    }

    function handleLogout() {
        localStorage.removeItem("adminUser");
        router.push("/login");
    }

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <BrandLogoIcon size={82} color="#ffffff" accentColor="#ffffff" title="intelliCV admin" style={{ margin: "0 auto" }} />
                </div>
                <nav className={styles.navMenu}>
                    <ul>
                        <li onClick={() => router.push("/admin/dashboard")}>Dashboard</li>
                        <li>Admin Accounts</li>
                        <li className={styles.active}>Recruiter Accounts</li>
                        <li>Activity Logs</li>
                        <li onClick={handleLogout} className={styles.logoutItem}>Logout</li>
                    </ul>
                </nav>
            </aside>

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Recruiter Accounts</h1>
                </header>

                <main className={styles.contentArea}>
                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>Create Recruiter Account</h3>
                            </div>
                        </div>
                        <form className={styles.createForm} onSubmit={handleCreateRecruiter}>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Recruiter email" required />
                            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" type="password" required />
                            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" required />
                            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Recruiter full name" />
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                            <button className={styles.primaryButton} type="submit">Create recruiter</button>
                        </form>
                    </section>

                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>Recruiter Management</h3>
                            </div>
                        </div>
                        {loading ? <p>Loading...</p> : (
                            <div className={styles.recruiterGrid}>
                                {recruiters.map((recruiter) => {
                                    const initial = (recruiter.company_name || recruiter.email || "R").charAt(0).toUpperCase();
                                    return (
                                        <article key={recruiter.id} className={styles.recruiterCard}>
                                            <div className={styles.recruiterAvatar}>{initial}</div>
                                            <div className={styles.recruiterBody}>
                                                <h4>{recruiter.company_name || "No company name"}</h4>
                                                <p>{recruiter.full_name || "Recruiter account"}</p>
                                                <p>{recruiter.email}</p>
                                                <p>{recruiter.phone || "No phone"}</p>
                                                <span className={styles.recruiterBadge}>{recruiter.is_active ? "Active" : "Inactive"}</span>
                                            </div>
                                        </article>
                                    );
                                })}
                                {recruiters.length === 0 && <p className={styles.emptyState}>No recruiter accounts yet</p>}
                            </div>
                        )}
                    </section>

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
