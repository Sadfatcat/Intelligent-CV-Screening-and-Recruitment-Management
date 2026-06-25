"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogoIcon from "@/components/brand/BrandLogoIcon";
import { apiUrl } from "@/utils/api";
import { clearAuthSession, getStoredUser } from "@/utils/authSession";
import styles from "../dashboard/dashboard.module.css";

type RecruiterAccount = {
    id: number;
    email: string;
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    is_active: boolean;
};

const DEMO_ROUTES = [
    { label: "Admin", href: "/admin/dashboard" },
    { label: "Recruiter", href: "/recruiter_UI" },
    { label: "Candidate", href: "/candidate" },
];

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
    const [editingRecruiter, setEditingRecruiter] = useState<RecruiterAccount | null>(null);
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editCompanyName, setEditCompanyName] = useState("");
    const [editFullName, setEditFullName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [deletingRecruiterId, setDeletingRecruiterId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    useEffect(() => {
        const sessionAdmin = getStoredUser("admin");
        if (sessionAdmin) {
            window.setTimeout(() => setAdminId(sessionAdmin.user_id), 0);
            return;
        }

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
            loadRecruiters(adminId).catch(() => {});
        }, 0);

        return () => window.clearTimeout(timer);
    }, [adminId]);

    async function loadRecruiters(currentAdminId = adminId) {
        if (!currentAdminId) return;
        setLoading(true);
        try {
            const response = await fetch(apiUrl(`/api/admin/recruiters?admin_id=${currentAdminId}`));
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to load recruiters");
            }
            setRecruiters(Array.isArray(data) ? data : []);
            setMessage("");
            setMessageType("");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to load recruiters");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    }

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
                    password: password.trim() || undefined,
                    company_name: companyName,
                    full_name: fullName,
                    phone,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to create recruiter");
            }

            setMessage(password.trim() ? "Recruiter created successfully" : "Recruiter created successfully with default password: 1");
            setMessageType("success");
            setEmail("");
            setPassword("");
            setCompanyName("");
            setFullName("");
            setPhone("");

            await loadRecruiters(adminId);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to create recruiter");
            setMessageType("error");
        }
    }

    function openEditRecruiter(recruiter: RecruiterAccount) {
        setEditingRecruiter(recruiter);
        setEditEmail(recruiter.email);
        setEditPassword("");
        setEditCompanyName(recruiter.company_name || "");
        setEditFullName(recruiter.full_name || "");
        setEditPhone(recruiter.phone || "");
        setMessage("");
        setMessageType("");
    }

    function closeEditRecruiter() {
        setEditingRecruiter(null);
        setEditEmail("");
        setEditPassword("");
        setEditCompanyName("");
        setEditFullName("");
        setEditPhone("");
    }

    async function handleUpdateRecruiter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!adminId || !editingRecruiter) return;

        setIsSavingEdit(true);
        setMessage("");
        setMessageType("");
        try {
            const response = await fetch(apiUrl(`/api/admin/recruiters/${editingRecruiter.id}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    admin_id: adminId,
                    email: editEmail,
                    password: editPassword.trim() || undefined,
                    company_name: editCompanyName,
                    full_name: editFullName,
                    phone: editPhone,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to update recruiter");
            }

            setMessage(editPassword.trim() ? "Recruiter updated and password changed" : "Recruiter updated successfully");
            setMessageType("success");
            closeEditRecruiter();
            await loadRecruiters(adminId);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to update recruiter");
            setMessageType("error");
        } finally {
            setIsSavingEdit(false);
        }
    }

    async function handleDeleteRecruiter(recruiter: RecruiterAccount) {
        if (!adminId) return;
        const label = recruiter.company_name || recruiter.email;
        if (!window.confirm(`Delete recruiter account "${label}"? This also deletes this recruiter's jobs and related applications.`)) return;

        setDeletingRecruiterId(recruiter.id);
        setMessage("");
        setMessageType("");
        try {
            const response = await fetch(apiUrl(`/api/admin/recruiters/${recruiter.id}?admin_id=${adminId}`), {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to delete recruiter");
            }

            if (editingRecruiter?.id === recruiter.id) closeEditRecruiter();
            setMessage("Recruiter account deleted successfully");
            setMessageType("success");
            await loadRecruiters(adminId);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Failed to delete recruiter");
            setMessageType("error");
        } finally {
            setDeletingRecruiterId(null);
        }
    }

    function handleLogout() {
        clearAuthSession();
        router.push("/login");
    }

    function openDemoRoute(path: string) {
        window.open(path, "_blank", "noopener,noreferrer");
    }

    return (
        <div className={styles.dashboardContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <button
                        type="button"
                        onClick={() => router.push("/admin/dashboard")}
                        aria-label="Go to admin home"
                        style={{ all: "unset", cursor: "pointer", display: "block", margin: "0 auto" }}
                    >
                        <BrandLogoIcon size={82} color="#ffffff" accentColor="#ffffff" title="intelliCV admin" />
                    </button>
                </div>
                <nav className={styles.navMenu}>
                    <ul>
                        <li onClick={() => router.push("/admin/dashboard")}>Dashboard</li>
                        <li>Admin Accounts</li>
                        <li className={styles.active}>Recruiter Accounts</li>
                        <li>Activity Logs</li>
                        <li onClick={handleLogout} className={styles.logoutItem}>Logout</li>
                    </ul>
                    <div className={styles.quickSwapGroup}>
                        {DEMO_ROUTES.map((route) => (
                            <button key={route.href} type="button" className={styles.quickSwapButton} onClick={() => openDemoRoute(route.href)}>
                                {route.label}
                            </button>
                        ))}
                    </div>
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
                            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password (default: 1)" type="password" />
                            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" required />
                            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Recruiter full name" />
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                            <button className={styles.primaryButton} type="submit">Create recruiter</button>
                        </form>
                    </section>

                    {editingRecruiter && (
                        <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                            <div className={styles.panelTitleRow}>
                                <div>
                                    <h3>Edit Recruiter Account</h3>
                                    <p>Leave password blank to keep the current password.</p>
                                </div>
                            </div>
                            <form className={styles.createForm} onSubmit={handleUpdateRecruiter}>
                                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Recruiter email" required />
                                <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="New password (leave blank to keep current)" type="password" />
                                <input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} placeholder="Company name" required />
                                <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Recruiter full name" />
                                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" />
                                <div className={styles.formActionRow}>
                                    <button className={styles.primaryButton} type="submit" disabled={isSavingEdit}>
                                        {isSavingEdit ? "Saving..." : "Save changes"}
                                    </button>
                                    <button className={styles.secondaryButton} type="button" onClick={closeEditRecruiter}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

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
                                                <div className={styles.recruiterActionRow}>
                                                    <button className={styles.secondaryButton} type="button" onClick={() => openEditRecruiter(recruiter)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className={styles.dangerButton}
                                                        type="button"
                                                        onClick={() => void handleDeleteRecruiter(recruiter)}
                                                        disabled={deletingRecruiterId === recruiter.id}
                                                    >
                                                        {deletingRecruiterId === recruiter.id ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
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
