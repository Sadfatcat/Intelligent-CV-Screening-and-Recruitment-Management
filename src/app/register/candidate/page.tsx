"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import brightStyles from "./page.bright.module.css";
import { handleRegisterSubmit } from "@/utils/registerHandler";
import BrandLogoFull from "@/components/brand/BrandLogoFull";
import BackButton from "@/components/navigation/BackButton";

function RegisterCandidatePageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");
  const styles = brightStyles;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    await handleRegisterSubmit(
      e,
      { email, password, confirmPassword, emailError, passwordError, resultMessage, resultType },
      {
        setEmail,
        setPassword,
        setConfirmPassword,
        setEmailError,
        setPasswordError,
        setResultMessage,
        setResultType,
      },
      () => {
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    );
  }
  return (
    <div className={styles.container}>
      <div className={styles.register}>
        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <div className={styles.registerHeader}>
            <BackButton fallbackHref="/candidate" className={styles.backButton} />
            <BrandLogoFull iconSize={56} />
            <p>Create a candidate account to submit CVs and track applied jobs.</p>
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

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div
            className={
              resultType === "success" ? styles.success : styles.error
            }
          >
            {resultMessage}
          </div>

          <button type="submit">Create account</button>

          <p className={styles.linkText}>
            Already have an account? <Link href="/login">Login here</Link>
          </p>
          <p className={styles.linkText}>
            Recruiter accounts are created by an admin.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterCandidatePage() {
  return (
    <Suspense fallback={<div />}>
      <RegisterCandidatePageContent />
    </Suspense>
  );
}
