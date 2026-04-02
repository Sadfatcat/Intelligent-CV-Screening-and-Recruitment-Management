"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { handleRegisterSubmit } from "@/utils/registerHandler";
import Navbar from "@/components/navbar/Navbar";
import ImageSlider from "@/components/ImageSlider";

export default function RegisterRecruiterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const success = handleRegisterSubmit(
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
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.register}>
          <form className={styles.registerForm} onSubmit={handleSubmit}>
            <h1>Register</h1>

            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className={styles.error}>{emailError}</div>
            <div className={styles.error}>{passwordError}</div>

            <div
              className={
                resultType === "success" ? styles.success : styles.error
              }
            >
              {resultMessage}
            </div>

            <button type="submit">register</button>

            <p className={styles.linkText}>
              Already have an account? <Link href="/login">Login here</Link>
            </p>
          </form>
        </div>
        <div className={styles.rightside}>
          <ImageSlider />
        </div>
      </div>
    </>
  );
}
