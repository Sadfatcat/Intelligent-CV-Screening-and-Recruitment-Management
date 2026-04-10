"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function AdminRegisterPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <div className={styles.glassPanel}>
                    <h2>Workflow Updated</h2>
                    <p>Recruiter accounts are now created by admin from dashboard.</p>
                    <p>Use admin login to access recruiter account management.</p>
                    <div className={styles.actions}>
                        <Link href="/admin/login" className={styles.loginLink}>
                            Go to Admin Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
