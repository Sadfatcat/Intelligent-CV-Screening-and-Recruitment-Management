"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogoIcon from "@/components/brand/BrandLogoIcon";
import { apiUrl } from "@/utils/api";
import { clearAuthSession, getStoredUser } from "@/utils/authSession";
import styles from "../dashboard/dashboard.module.css";

type ActivityItem = {
    id: number;
    actor_user_id: number | null;
    actor_role: string;
    action: string;
    target_type: string;
    target_id: number | null;
    detail: string | null;
    created_at: string;
};

const ACCOUNT_ACTIVITY_ACTIONS = new Set([
    "candidate.register",
    "admin.create.recruiter",
    "recruiter.password.change",
    "user.login",
]);

export default function AdminActivityLogsPage() {
    const router = useRouter();
    const [adminId, setAdminId] = useState<number | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    useEffect(() => {
        const sessionAdmin = getStoredUser("admin");
        if (sessionAdmin) {
            setAdminId(sessionAdmin.user_id);
            return;
        }
        router.push("/login");
    }, [router]);

    useEffect(() => {
        async function loadActivities() {
            if (!adminId) return;
            setLoading(true);
            try {
                const response = await fetch(apiUrl(`/api/admin/activities?admin_id=${adminId}&limit=1000`));
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Unable to load activity logs");
                }

                setActivities(Array.isArray(data) ? data : []);
                setMessage("");
                setMessageType("");
            } catch (err) {
                setMessage(err instanceof Error ? err.message : "Failed to load activity logs");
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        }

        loadActivities();
    }, [adminId]);

    const accountActivities = useMemo(
        () => activities.filter((activity) => ACCOUNT_ACTIVITY_ACTIONS.has(activity.action)),
        [activities]
    );

    function handleLogout() {
        clearAuthSession();
        router.push("/login");
    }

    function formatActivityTime(value: string) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
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
                        <li onClick={() => router.push("/admin/recruiters")}>Recruiter Accounts</li>
                        <li className={styles.active}>Activity Logs</li>
                        <li onClick={handleLogout} className={styles.logoutItem}>Logout</li>
                    </ul>
                </nav>
            </aside>

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Activity Logs</h1>
                </header>

                <main className={styles.contentArea}>
                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>Account Activity Logs</h3>
                                <p>Recent account-level events for admin, recruiter, and candidate actions.</p>
                            </div>
                        </div>

                        {loading ? <p className={styles.emptyState}>Loading...</p> : null}
                        {!loading && accountActivities.length === 0 ? <p className={styles.emptyState}>No account activity yet</p> : null}
                        {!loading && accountActivities.length > 0 ? (
                            <ul className={styles.activityList}>
                                {accountActivities.map((activity) => (
                                    <li key={activity.id} className={styles.activityItem}>
                                        <div className={styles.activityMeta}>
                                            <span className={styles.activityTime}>{formatActivityTime(activity.created_at)}</span>
                                            <span className={styles.activityRole}>[{activity.actor_role}]</span>
                                        </div>
                                        <div className={styles.activityDetail}>{activity.detail || activity.action}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
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
