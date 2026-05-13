"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../recruiter_UI/page.module.css";
import { RecruiterToast } from "../../../features/recruiter/components/RecruiterToast";
import { RECRUITER_PASSWORD_CHANGE_STORAGE_KEY, RECRUITER_SESSION_STORAGE_KEY } from "../../../features/recruiter/constants/recruiterConstants";
import { changeRecruiterPassword } from "../../../features/recruiter/services/recruiterApi";
import type { RecruiterSession } from "../../../features/recruiter/types/recruiterTypes";

// Recruiter Password Change: bắt đổi mật khẩu mặc định trước khi vào workspace.
export default function RecruiterChangePasswordPage() {
    const router = useRouter();
    const [pendingSession, setPendingSession] = useState<RecruiterSession | null>(null);
    const [currentPassword, setCurrentPassword] = useState("1");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(RECRUITER_PASSWORD_CHANGE_STORAGE_KEY);
        if (!raw) {
            router.replace("/recruiter/login");
            return;
        }

        try {
            const parsed = JSON.parse(raw) as RecruiterSession;
            if (parsed.role !== "recruiter" || !parsed.must_change_password) {
                router.replace("/recruiter/login");
                return;
            }
            setPendingSession(parsed);
        } catch {
            localStorage.removeItem(RECRUITER_PASSWORD_CHANGE_STORAGE_KEY);
            router.replace("/recruiter/login");
        }
    }, [router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!pendingSession) return;

        setMessage("");
        setMessageType("");

        if (newPassword !== confirmPassword) {
            setMessage("Confirm password does not match");
            setMessageType("error");
            return;
        }

        setIsSubmitting(true);
        try {
            await changeRecruiterPassword(pendingSession.user_id, currentPassword, newPassword);
            const nextSession = { ...pendingSession, must_change_password: false };
            localStorage.removeItem(RECRUITER_PASSWORD_CHANGE_STORAGE_KEY);
            localStorage.setItem(RECRUITER_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
            setMessage("Password changed successfully");
            setMessageType("success");
            router.push("/recruiter_UI");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Change password failed");
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={`${styles.page} ${styles.loginPage}`}>
            <div className={`${styles.card} ${styles.loginWrap}`}>
                <div className={styles.loginHeader}>
                    <p className={styles.loginEyebrow}>Recruiter Security</p>
                    <h1 className={styles.title}>Change Password</h1>
                    <p className={styles.subtleText}>This recruiter account is using the default password. Create a new password before opening the workspace.</p>
                </div>
                <form className={styles.loginForm} onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                    />
                    <button className={styles.button} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save new password"}
                    </button>
                </form>
            </div>
            <RecruiterToast message={message} type={messageType} />
        </div>
    );
}
