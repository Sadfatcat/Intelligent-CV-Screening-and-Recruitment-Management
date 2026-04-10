"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import Navbar from "@/components/navbar/Navbar";

export default function RecruiterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => (prev === null ? null : prev - 1)), 1000);
      return () => clearTimeout(timer);
    }
    router.push("/recruiter/dashboard");
  }, [countdown, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail || "Login failed");
        setMessageType("error");
        return;
      }

      if (data.role !== "recruiter") {
        setMessage("Tài khoản này không phải recruiter.");
        setMessageType("error");
        return;
      }

      localStorage.setItem("recruiterUser", JSON.stringify(data));
      localStorage.setItem("currentUser", JSON.stringify(data));
      setMessage("Login successful");
      setMessageType("success");
      setCountdown(2);
    } catch {
      setMessage("Cannot connect to backend.");
      setMessageType("error");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.board}>
        <img src="/usthabove.jpeg" alt="Recruiter board" className={styles.image} />
      </div>
      <div className={styles.login}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h1>Recruiter Login</h1>

          <input
            type="email"
            placeholder="company email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className={messageType === "success" ? styles.success : styles.error}>
            {message}
            {countdown !== null && messageType === "success" && (
              <span className={styles.countdown}>Redirecting in {countdown}...</span>
            )}
          </div>

          <button type="submit" disabled={countdown !== null}>
            {countdown !== null ? "Loading..." : "Login"}
          </button>

          <p className={styles.linkText}>
            Account is created by admin. <Link href="/admin/login">Go to Admin</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
