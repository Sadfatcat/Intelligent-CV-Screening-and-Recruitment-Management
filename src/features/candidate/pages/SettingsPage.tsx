"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/navbar/Navbar_candidate";
import { apiUrl } from "@/utils/api";
import { AUTH_SESSION_STORAGE_KEY } from "@/utils/authSession";
import styles from "../../../app/candidate/settings/page.module.css";

type CurrentUser = {
    email?: string;
    user_id?: number;
    role?: string;
    full_name?: string;
    phone?: string;
    address?: string;
    user?: {
        email?: string;
        full_name?: string;
        phone?: string;
        address?: string;
    };
};

export default function SettingsPage() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem("currentUser");
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as CurrentUser;
            setCurrentUser(parsed);
            setFullName(parsed.full_name ?? parsed.user?.full_name ?? "");
            setPhone(parsed.phone ?? parsed.user?.phone ?? "");
        } catch {
            setCurrentUser(null);
        }
    }, []);

    const profile = useMemo(() => {
        const email = currentUser?.email ?? currentUser?.user?.email ?? "";
        const fallbackName = email.includes("@") ? email.split("@")[0] : "Candidate";
        return {
            name: currentUser?.full_name ?? currentUser?.user?.full_name ?? fallbackName,
            email: email || "Not available",
            phone: currentUser?.phone ?? currentUser?.user?.phone ?? "Not available",
            address: currentUser?.address ?? currentUser?.user?.address ?? "Not available",
            role: currentUser?.role ?? "candidate",
            userId: typeof currentUser?.user_id === "number" ? String(currentUser.user_id) : "Not available",
            userIdValue: typeof currentUser?.user_id === "number" ? currentUser.user_id : null,
        };
    }, [currentUser]);

    async function parseResponse(response: Response, fallbackMessage: string) {
        const contentType = response.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : { detail: await response.text() };
        if (!response.ok) throw new Error(data.detail || fallbackMessage);
        return data;
    }

    function updateStoredUser(nextFields: Partial<CurrentUser>) {
        setCurrentUser((current) => {
            if (!current) return current;
            const nextUser = {
                ...current,
                ...nextFields,
                user: current.user ? { ...current.user, ...nextFields } : current.user,
            };
            localStorage.setItem("currentUser", JSON.stringify(nextUser));
            return nextUser;
        });

        try {
            const rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
            if (!rawSession) return;
            const parsedSession = JSON.parse(rawSession) as {
                access_token?: string;
                expires_at: number;
                user?: Record<string, unknown>;
            };
            if (!parsedSession?.user) return;
            const nextSession = {
                ...parsedSession,
                user: {
                    ...parsedSession.user,
                    ...nextFields,
                },
            };
            localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
        } catch {
            // Keep the current user cache updated even if the session cache cannot be parsed.
        }
    }

    async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setProfileStatus(null);
        if (profile.userIdValue === null) {
            setProfileStatus({ type: "error", message: "Candidate session is missing. Please login again." });
            return;
        }
        try {
            setIsSavingProfile(true);
            const response = await fetch(apiUrl(`/api/auth/candidate/${profile.userIdValue}/profile`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
            });
            const data = await parseResponse(response, "Profile update failed");
            updateStoredUser({ full_name: data.full_name || fullName.trim(), phone: data.phone || phone.trim() });
            setProfileStatus({ type: "success", message: "Personal information updated." });
        } catch (err) {
            setProfileStatus({ type: "error", message: err instanceof Error ? err.message : "Profile update failed" });
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordStatus(null);
        if (profile.userIdValue === null) {
            setPasswordStatus({ type: "error", message: "Candidate session is missing. Please login again." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: "error", message: "New passwords do not match." });
            return;
        }
        try {
            setIsChangingPassword(true);
            const response = await fetch(apiUrl("/api/auth/change-password"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: profile.userIdValue, current_password: currentPassword, new_password: newPassword }),
            });
            await parseResponse(response, "Change password failed");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordStatus({ type: "success", message: "Password changed successfully." });
        } catch (err) {
            setPasswordStatus({ type: "error", message: err instanceof Error ? err.message : "Change password failed" });
        } finally {
            setIsChangingPassword(false);
        }
    }

    return (
        <main className={styles.container}>
            <Navbar />
            <section className={styles.panel}>
                <div className={styles.header}>
                    <div className={styles.avatar} aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <p className={styles.kicker}>Candidate Settings</p>
                        <h1>{profile.name}</h1>
                        <p>{profile.email}</p>
                    </div>
                </div>

                <div className={styles.settingsGrid}>
                    <form className={styles.settingsCard} onSubmit={handleProfileSubmit}>
                        <div className={styles.sectionTitle}>
                            <h2>Personal information</h2>
                            <p>Only full name and phone number can be changed by candidates.</p>
                        </div>
                        <div className={styles.grid}>
                            <label className={styles.field}>
                                <span>Full name</span>
                                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={profile.name} />
                            </label>
                            <label className={styles.field}>
                                <span>Phone</span>
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={profile.phone} />
                            </label>
                            <label className={`${styles.field} ${styles.disabledField}`}>
                                <span>Email</span>
                                <input value={profile.email} disabled />
                            </label>
                            <label className={`${styles.field} ${styles.disabledField}`}>
                                <span>Role</span>
                                <input value={profile.role} disabled />
                            </label>
                            <label className={`${styles.field} ${styles.disabledField}`}>
                                <span>User ID</span>
                                <input value={profile.userId} disabled />
                            </label>
                            <label className={`${styles.field} ${styles.disabledField}`}>
                                <span>Address</span>
                                <input value={profile.address} disabled />
                            </label>
                        </div>
                        {profileStatus && (
                            <p className={`${styles.statusMessage} ${profileStatus.type === "success" ? styles.success : styles.error}`}>
                                {profileStatus.message}
                            </p>
                        )}
                        <button className={styles.primaryButton} type="submit" disabled={isSavingProfile}>
                            {isSavingProfile ? "Saving..." : "Save personal info"}
                        </button>
                    </form>

                    <form className={styles.settingsCard} onSubmit={handlePasswordSubmit}>
                        <div className={styles.sectionTitle}>
                            <h2>Change password</h2>
                            <p>Use your current password before setting a new one.</p>
                        </div>
                        <div className={styles.grid}>
                            <label className={styles.field}>
                                <span>Current password</span>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                            </label>
                            <label className={styles.field}>
                                <span>New password</span>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
                            </label>
                            <label className={styles.field}>
                                <span>Confirm password</span>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
                            </label>
                        </div>
                        {passwordStatus && (
                            <p className={`${styles.statusMessage} ${passwordStatus.type === "success" ? styles.success : styles.error}`}>
                                {passwordStatus.message}
                            </p>
                        )}
                        <button className={styles.primaryButton} type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? "Changing..." : "Change password"}
                        </button>
                    </form>
                </div>

                <div className={styles.actions}>
                    <Link className={styles.primaryLink} href="/candidate">Back to Jobs</Link>
                </div>
            </section>
        </main>
    );
}
