"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { apiUrl } from "@/utils/api";
import { clearAuthSession, getStoredUser } from "@/utils/authSession";
import BrandLogoIcon from "@/components/brand/BrandLogoIcon";
import { DashboardLineChart } from "@/components/charts/DashboardCharts";

type AdminOverview = {
    total_admins?: number;
    total_candidates?: number;
    total_recruiters?: number;
    active_admins?: number;
    inactive_admins?: number;
    active_recruiters?: number;
    inactive_recruiters?: number;
    recruiters_with_default_password?: number;
    total_jobs?: number;
    total_applications?: number;
};

type RecruiterAccount = {
    id: number;
    email: string;
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    is_active: boolean;
};

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

type DashboardRange = "7d" | "30d" | "all";

type TrendPoint = {
    date: string;
    recruiter?: number;
    candidate?: number;
    jobs?: number;
    cvs?: number;
};

function getDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getRangeDates(range: DashboardRange, allKeys: string[]) {
    if (range === "all") return allKeys;

    const now = new Date();
    const days = range === "7d" ? 7 : 30;
    const dates: string[] = [];
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    for (let index = 0; index < days; index += 1) {
        const current = new Date(start);
        current.setDate(start.getDate() + index);
        dates.push(getDateKey(current));
    }

    return dates;
}

function buildTrend(
    items: ActivityItem[],
    range: DashboardRange,
    actionMap: Record<string, string>
): TrendPoint[] {
    const allKeys = new Set<string>();
    const counts = new Map<string, TrendPoint>();
    const actionEntries = Object.entries(actionMap);

    items.forEach((activity) => {
        const metric = actionEntries.find(([, action]) => action === activity.action)?.[0];
        if (!metric) return;

        const date = new Date(activity.created_at);
        if (Number.isNaN(date.getTime())) return;

        const key = getDateKey(date);
        allKeys.add(key);
        const current = counts.get(key) || { date: key };
        current[metric as keyof Omit<TrendPoint, "date">] = ((current[metric as keyof Omit<TrendPoint, "date">] as number | undefined) || 0) + 1;
        counts.set(key, current);
    });

    const keys = getRangeDates(range, Array.from(allKeys).sort((a, b) => a.localeCompare(b)));
    return keys.map((date) => ({ date, ...(counts.get(date) || {}) }));
}

export default function AdminDashboard() {
    const router = useRouter();
    const [adminId, setAdminId] = useState<number | null>(null);
    const [overview, setOverview] = useState<AdminOverview | null>(null);
    const [recruiters, setRecruiters] = useState<RecruiterAccount[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const [userTrendRange, setUserTrendRange] = useState<DashboardRange>("7d");
    const [recruitmentTrendRange, setRecruitmentTrendRange] = useState<DashboardRange>("7d");

    useEffect(() => {
        const sessionAdmin = getStoredUser("admin");
        if (sessionAdmin) {
            setAdminId(sessionAdmin.user_id);
            return;
        }
        router.push("/login");
    }, [router]);

    useEffect(() => {
        async function loadData() {
            if (!adminId) return;
            setLoading(true);
            try {
                const [overviewRes, recruitersRes, activitiesRes] = await Promise.all([
                    fetch(apiUrl(`/api/admin/overview?admin_id=${adminId}`)),
                    fetch(apiUrl(`/api/admin/recruiters?admin_id=${adminId}`)),
                    fetch(apiUrl(`/api/admin/activities?admin_id=${adminId}&limit=1000`)),
                ]);

                const overviewData = await overviewRes.json();
                const recruitersData = await recruitersRes.json();
                const activitiesData = await activitiesRes.json();

                if (!overviewRes.ok || !recruitersRes.ok || !activitiesRes.ok) {
                    throw new Error("Unable to load admin dashboard data");
                }

                setOverview(overviewData);
                setRecruiters(Array.isArray(recruitersData) ? recruitersData : []);
                setActivities(Array.isArray(activitiesData) ? activitiesData : []);
                setMessage("");
                setMessageType("");
            } catch (err) {
                setMessage(err instanceof Error ? err.message : "Failed to load data");
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [adminId]);

    const userTrend = useMemo(
        () => buildTrend(
            activities,
            userTrendRange,
            {
                recruiter: "admin.create.recruiter",
                candidate: "candidate.register",
            }
        ),
        [activities, userTrendRange]
    );

    const recruitmentTrend = useMemo(
        () => buildTrend(
            activities,
            recruitmentTrendRange,
            {
                jobs: "recruiter.job.upload",
                cvs: "candidate.cv.submit",
            }
        ),
        [activities, recruitmentTrendRange]
    );

    const activeRecruiters = recruiters.filter((recruiter) => recruiter.is_active).length;
    const inactiveRecruiters = recruiters.length - activeRecruiters;

    const handleLogout = () => {
        clearAuthSession();
        router.push("/login");
    };

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

    function formatTrendDate(value: string) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    }

    function RangeFilter({
        value,
        onChange,
    }: {
        value: DashboardRange;
        onChange: (value: DashboardRange) => void;
    }) {
        return (
            <div className={styles.rangeControl}>
                {(["7d", "30d", "all"] as DashboardRange[]).map((range) => (
                    <button
                        key={range}
                        className={`${styles.rangeButton} ${value === range ? styles.rangeButtonActive : ""}`}
                        type="button"
                        onClick={() => onChange(range)}
                    >
                        {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
                    </button>
                ))}
            </div>
        );
    }

    function TrendLineChart({
        points,
        series,
    }: {
        points: TrendPoint[];
        series: Array<{ key: keyof Omit<TrendPoint, "date">; label: string; color: string }>;
    }) {
        if (!points.length) {
            return <p className={styles.emptyState}>{loading ? "Loading..." : "No activity data yet"}</p>;
        }

        return (
            <div className={styles.lineChartWrap}>
                <DashboardLineChart
                    points={points}
                    series={series}
                    getLabel={(point) => formatTrendDate(point.date)}
                    emptyText={loading ? "Loading..." : "No activity data yet"}
                    textColor="#200080"
                />
            </div>
        );
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
                        <li className={styles.active}>Dashboard</li>
                        <li onClick={() => router.push("/admin/recruiters")}>Recruiter Accounts</li>
                        <li onClick={() => router.push("/admin/activity-logs")}>Activity Logs</li>
                        <li onClick={handleLogout} className={styles.logoutItem}>Logout</li>
                    </ul>
                </nav>
            </aside>

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Admin Dashboard</h1>
                </header>

                <main className={styles.contentArea}>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Admin Accounts</h3>
                        <p>{overview?.total_admins ?? "-"}</p>
                    </div>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Recruiter Accounts</h3>
                        <p>{overview?.total_recruiters ?? "-"}</p>
                    </div>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Active Recruiters</h3>
                        <p>{overview?.active_recruiters ?? activeRecruiters}</p>
                    </div>
                    <div className={`${styles.card} ${styles.statCard}`}>
                        <h3>Default Passwords</h3>
                        <p>{overview?.recruiters_with_default_password ?? "-"}</p>
                    </div>

                    <section className={`${styles.card} ${styles.panelCard} ${styles.accountStatusPanel}`}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>Account Status</h3>
                            </div>
                        </div>
                        <div className={styles.accountStatusGrid}>
                            <span>Active Admins<strong>{overview?.active_admins ?? "-"}</strong></span>
                            <span>Inactive Admins<strong>{overview?.inactive_admins ?? "-"}</strong></span>
                            <span>Inactive Recruiters<strong>{overview?.inactive_recruiters ?? inactiveRecruiters}</strong></span>
                        </div>
                    </section>

                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>New Users Trend</h3>
                            </div>
                            <RangeFilter value={userTrendRange} onChange={setUserTrendRange} />
                        </div>
                        <TrendLineChart
                            points={userTrend}
                            series={[
                                { key: "recruiter", label: "Recruiters", color: "#b05a36" },
                                { key: "candidate", label: "Candidates", color: "#2563eb" },
                            ]}
                        />
                    </section>

                    <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                        <div className={styles.panelTitleRow}>
                            <div>
                                <h3>Jobs and CV Applications Trend</h3>
                            </div>
                            <RangeFilter value={recruitmentTrendRange} onChange={setRecruitmentTrendRange} />
                        </div>
                        <TrendLineChart
                            points={recruitmentTrend}
                            series={[
                                { key: "jobs", label: "Jobs Created", color: "#15803d" },
                                { key: "cvs", label: "CVs Applied", color: "#dc2626" },
                            ]}
                        />
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
