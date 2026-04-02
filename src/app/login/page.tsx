"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { handleLoginSubmit } from "@/utils/loginHandler";
import Navbar from "@/components/navbar/Navbar";
import ImageSlider from "@/components/ImageSlider";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("registeredEmail");
    const savedPassword = localStorage.getItem("registeredPassword");
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

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
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.board}>
          <div className={styles.content}>
            <ImageSlider />
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
    </>
  );
}