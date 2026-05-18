import styles from "../../../app/recruiter_UI/page.module.css";

type RecruiterStatCardProps = {
    label: string;
    value: number | string;
    tone?: "neutral" | "scored" | "passed" | "borderline" | "failed";
};

// Dashboard Stat: một chỉ số tổng quan trên dashboard.
export function RecruiterStatCard({ label, value, tone = "neutral" }: RecruiterStatCardProps) {
    const toneClass = {
        neutral: styles.statNeutral,
        scored: styles.statScored,
        passed: styles.statPassed,
        borderline: styles.statBorderline,
        failed: styles.statFailed,
    }[tone];

    return (
        <article className={`${styles.card} ${styles.statCard} ${toneClass}`}>
            <h3>{label}</h3>
            <p>{value}</p>
        </article>
    );
}
