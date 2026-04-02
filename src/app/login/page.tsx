"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { handleLoginSubmit } from "@/utils/loginHandler";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    handleLoginSubmit(email, password, {
      setEmail,
      setPassword,
      setEmailError,
      setPasswordError,
      setResultMessage,
      setResultType,
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.board}>
        <div className={styles.content}>
          <Image src = "/fintlogo.png" width={600} height={600}  />
        </div>
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
          </div>

          <button type="submit">login</button>

          <p className={styles.linkText}>
            Don&apos;t have an account?{" "}
            <Link href="/register/recruiter">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}