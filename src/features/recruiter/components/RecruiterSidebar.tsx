import styles from "../../../app/recruiter_UI/page.module.css";
import BrandLogo from "../../../components/brand/BrandLogo";

type RecruiterSidebarProps = {
    companyLabel: string;
    email?: string;
    activeWorkspace: "overview" | "scoring";
    onOpenDashboard: () => void;
    onOpenScoring: () => void;
    onOpenUpload: () => void;
    onLogout: () => void;
};

// Sidebar: điều hướng chính của recruiter workspace.
export function RecruiterSidebar({
    companyLabel,
    email,
    activeWorkspace,
    onOpenDashboard,
    onOpenScoring,
    onOpenUpload,
    onLogout,
}: RecruiterSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoBox}>
                <BrandLogo title="IntelliCV" subtitle="Recruiter Workspace" inverted />
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
                    className={`${styles.navButton} ${activeWorkspace === "scoring" ? styles.navButtonActive : ""}`}
                    onClick={onOpenScoring}
                >
                    CV Scoring
                </button>
                <button className={`${styles.navButton} ${styles.navButtonPrimary}`} onClick={onOpenUpload}>
                    Create JD
                </button>
            </div>
        </aside>
    );
}
