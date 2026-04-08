"use client";

import { useEffect }  from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { handleLoginSubmit } from "@/utils/loginHandler";
import Navbar from "@/components/navbar/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/candidate_UI");
    }
  }, [countdown, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const isSuccess = handleLoginSubmit(email, password, {
      setEmail,
      setPassword,
      setEmailError,
      setPasswordError,
      setResultMessage,
      setResultType,
    });

    if (isSuccess) {
      setCountdown(3);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
          <Navbar />
        </div>
      <div className={styles.board}>
        <img src="/usthabove.jpeg" alt="Image" className={styles.image} />
      </div>
      <div className={styles.login}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h1>Login</h1>

          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className={styles.error}>{emailError}</div>

          <input
            type="password"
            placeholder="password"
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
            {countdown !== null && resultType === "success" && (
              <span style={{ display: "block", marginTop: "8px", fontWeight: "bold" }}>
                Page switch after {countdown}...
              </span>
            )}
          </div>

          <button type="submit" disabled={countdown !== null}>
            {countdown !== null ? "Loading..." : "login"}
          </button>

          <p className={styles.linkText}>
            Don&apos;t have an account?{" "}
            <Link href="/register/candidate">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}