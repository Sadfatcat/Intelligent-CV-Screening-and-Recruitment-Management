"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import brightStyles from "./page.bright.module.css";
import { handleLoginSubmit } from "@/utils/loginHandler";
import BrandLogo from "@/components/brand/BrandLogo";

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
    <div className={styles.container}>
      <div className={styles.login}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.loginHeader}>
            <BrandLogo title="IntelliCV" subtitle="Unified Access" />
            <p>Sign in with your candidate, recruiter, or admin account.</p>
          </div>

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

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <p className={styles.linkText}>
            Don&apos;t have an account?{" "}
            <Link href="/register/candidate">Register here</Link>
          </p>
          <p className={styles.linkText}>
            Recruiter account? <Link href="/recruiter/login">Use recruiter login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
