"use client";

import { useEffect, useState } from "react";
import { RECRUITER_SESSION_STORAGE_KEY } from "../constants/recruiterConstants";
import { changeRecruiterPassword, updateRecruiterProfile } from "../services/recruiterApi";
import type { RecruiterSession } from "../types/recruiterTypes";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    session: RecruiterSession;
    onSessionUpdated: (session: RecruiterSession) => void;
    onMessage: (message: string, type: "success" | "error") => void;
};

export default function SettingsPage({ session, onSessionUpdated, onMessage }: Props) {
    const [fullName, setFullName] = useState(session.full_name || "");
    const [phone, setPhone] = useState(session.phone || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        setFullName(session.full_name || "");
        setPhone(session.phone || "");
    }, [session.full_name, session.phone]);

    async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const data = await updateRecruiterProfile(session.user_id, { full_name: fullName, phone });
            const nextSession: RecruiterSession = {
                ...session,
                full_name: data.full_name ?? null,
                phone: data.phone ?? null,
                email: data.email || session.email,
                company_name: data.company_name || session.company_name,
            };
            localStorage.setItem(RECRUITER_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
            onSessionUpdated(nextSession);
            onMessage("Profile updated successfully.", "success");
        } catch (err) {
            onMessage(err instanceof Error ? err.message : "Update profile failed", "error");
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            onMessage("Confirm password does not match.", "error");
            return;
        }
        setIsChangingPassword(true);
        try {
            await changeRecruiterPassword(session.user_id, currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onMessage("Password changed successfully.", "success");
        } catch (err) {
            onMessage(err instanceof Error ? err.message : "Change password failed", "error");
        } finally {
            setIsChangingPassword(false);
        }
    }

    return (
        <>
            <section className={`${styles.card} ${styles.panelCard} ${styles.settingsCard}`}>
                <div className={styles.panelTitleRow}>
                    <div>
                        <h3>Profile Settings</h3>
                        <p className={styles.subtleText}>Update the recruiter contact information shown in this workspace.</p>
                    </div>
                </div>
                <form className={styles.settingsForm} onSubmit={handleProfileSubmit}>
                    <label className={styles.settingsField}>
                        <span>Email</span>
                        <input className={styles.modalInput} value={session.email || ""} readOnly />
                    </label>
                    <label className={styles.settingsField}>
                        <span>Company</span>
                        <input className={styles.modalInput} value={session.company_name || ""} readOnly />
                    </label>
                    <label className={styles.settingsField}>
                        <span>Full name</span>
                        <input className={styles.modalInput} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Recruiter full name" />
                    </label>
                    <label className={styles.settingsField}>
                        <span>Phone</span>
                        <input className={styles.modalInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                    </label>
                    <div className={styles.settingsActions}>
                        <button className={styles.button} type="submit" disabled={isSavingProfile}>
                            {isSavingProfile ? "Saving..." : "Save profile"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={`${styles.card} ${styles.panelCard} ${styles.settingsCard}`}>
                <div className={styles.panelTitleRow}>
                    <div>
                        <h3>Password Settings</h3>
                        <p className={styles.subtleText}>Use your current password before setting a new one.</p>
                    </div>
                </div>
                <form className={styles.settingsForm} onSubmit={handlePasswordSubmit}>
                    <label className={styles.settingsField}>
                        <span>Current password</span>
                        <input className={styles.modalInput} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                    </label>
                    <label className={styles.settingsField}>
                        <span>New password</span>
                        <input className={styles.modalInput} type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </label>
                    <label className={styles.settingsField}>
                        <span>Confirm password</span>
                        <input className={styles.modalInput} type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </label>
                    <div className={styles.settingsActions}>
                        <button className={styles.button} type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? "Changing..." : "Change password"}
                        </button>
                    </div>
                </form>
            </section>
        </>
    );
}
