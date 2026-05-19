"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/navbar/Navbar_candidate";
import styles from "./page.module.css";

type CurrentUser = {
  email?: string;
  user_id?: number;
  role?: string;
  full_name?: string;
  phone?: string;
  user?: {
    email?: string;
    full_name?: string;
    phone?: string;
  };
};

export default function CandidateSettingsPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return;

    try {
      setCurrentUser(JSON.parse(raw));
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const profile = useMemo(() => {
    const email = currentUser?.email || currentUser?.user?.email || "";
    const fallbackName = email.includes("@") ? email.split("@")[0] : "Candidate";

    return {
      name: currentUser?.full_name || currentUser?.user?.full_name || fallbackName,
      email: email || "Not available",
      phone: currentUser?.phone || currentUser?.user?.phone || "Not available",
      role: currentUser?.role || "candidate",
      userId: typeof currentUser?.user_id === "number" ? String(currentUser.user_id) : "Not available",
    };
  }, [currentUser]);

  return (
    <main className={styles.container}>
      <Navbar />
      <section className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.avatar} aria-hidden="true">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className={styles.kicker}>Candidate Settings</p>
            <h1>{profile.name}</h1>
            <p>{profile.email}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <span>Full name</span>
            <strong>{profile.name}</strong>
          </div>
          <div className={styles.field}>
            <span>Email</span>
            <strong>{profile.email}</strong>
          </div>
          <div className={styles.field}>
            <span>Phone</span>
            <strong>{profile.phone}</strong>
          </div>
          <div className={styles.field}>
            <span>Role</span>
            <strong>{profile.role}</strong>
          </div>
          <div className={styles.field}>
            <span>User ID</span>
            <strong>{profile.userId}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <Link className={styles.primaryLink} href="/candidate">
            Back to Jobs
          </Link>
          <Link className={styles.secondaryLink} href="/login">
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}
