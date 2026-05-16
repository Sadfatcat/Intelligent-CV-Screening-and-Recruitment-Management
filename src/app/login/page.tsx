"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import brightStyles from "./page.bright.module.css";
import { handleLoginSubmit } from "@/utils/loginHandler";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = brightStyles;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await handleLoginSubmit(email, password, {
      setEmail,
      setPassword,
      setEmailError,
      setPasswordError,
      setResultMessage,
      setResultType,
    });

    setIsSubmitting(false);
    if (result.success && result.redirectPath) {
      router.push(result.redirectPath);
    }
  }

  return (
    <div className={`${styles.page} ${styles.loginPage}`}>
      <div className={`${styles.card} ${styles.loginWrap}`}>
        <div className={styles.loginHeader}>
          <p className={styles.loginEyebrow}>Unified Access</p>
          <h1 className={styles.title}>IntelliCV Login</h1>
          <p className={styles.subtleText}>Sign in as candidate, recruiter, or admin to continue to your workspace.</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className={styles.error}>{emailError}</div>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className={styles.error}>{passwordError}</div>

          <div
            className={
              resultType === "success" ? styles.success : styles.error
            }
          >
            {resultMessage}
          </div>

          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <p className={styles.linkText}>
            Don&apos;t have an account?{" "}
            <Link href="/register/candidate">Register here</Link>
          </p>
          <p className={styles.linkText}>
            Admin and recruiter accounts use this same login.
          </p>
        </form>
      </div>
    </div>
  );
}
