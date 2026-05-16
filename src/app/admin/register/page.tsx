"use client";

import Link from "next/link";
import styles from "./page.module.css";
import BackButton from "@/components/navigation/BackButton";

export default function AdminRegisterPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <div className={styles.glassPanel}>
                    <BackButton fallbackHref="/admin/dashboard" className={styles.loginLink} />
                    <h2>Workflow Updated</h2>
                    <p>Recruiter accounts are now created by admin from dashboard.</p>
                    <p>Use the unified login to access recruiter account management.</p>
                    <div className={styles.actions}>
                        <Link href="/login" className={styles.loginLink}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
