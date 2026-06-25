import styles from "../../../app/recruiter_UI/page.module.css";
import BrandLogoIcon from "../../../components/brand/BrandLogoIcon";

type RecruiterSidebarProps = {
    companyLabel: string;
    email?: string;
    activeWorkspace: "overview" | "jobs" | "applications";
    onOpenDashboard: () => void;
    onOpenJobs: () => void;
    onOpenApplications: () => void;
    onOpenUpload: () => void;
    onLogout: () => void;
};

// Sidebar: điều hướng chính của recruiter workspace.
export function RecruiterSidebar({
    companyLabel,
    email,
    activeWorkspace,
    onOpenDashboard,
    onOpenJobs,
    onOpenApplications,
    onOpenUpload,
    onLogout,
}: RecruiterSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoBox}>
                <button
                    type="button"
                    onClick={onOpenDashboard}
                    aria-label="Go to recruiter home"
                    style={{ all: "unset", cursor: "pointer", display: "block", margin: "0 auto 12px" }}
                >
                    <BrandLogoIcon size={82} color="#ffffff" accentColor="#ffffff" title="intelliCV recruiter" />
                </button>
                <div className={styles.accountBox}>
                    <div className={styles.avatar}>{companyLabel.charAt(0).toUpperCase()}</div>
                    <div>
                        <h2>{companyLabel}</h2>
                        <p>{email || "Recruiter account"}</p>
                        <button className={styles.sidebarLogoutInline} onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.navMenu}>
                <button
                    className={`${styles.navButton} ${activeWorkspace === "overview" ? styles.navButtonActive : ""}`}
                    onClick={onOpenDashboard}
                >
                    Dashboard
                </button>
                <button
                    className={`${styles.navButton} ${activeWorkspace === "jobs" ? styles.navButtonActive : ""}`}
                    onClick={onOpenJobs}
                >
                    Job Management
                </button>
                <button
                    className={`${styles.navButton} ${activeWorkspace === "applications" ? styles.navButtonActive : ""}`}
                    onClick={onOpenApplications}
                >
                    Submitted CVs
                </button>
                <button className={`${styles.navButton} ${styles.navButtonPrimary}`} onClick={onOpenUpload}>
                    Create JD
                </button>
            </div>
        </aside>
    );
}
