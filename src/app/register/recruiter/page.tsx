"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
// import { registerHandler }  from "@/utils/registerHandler";

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
    e.preventDefault();

    // Basic validation
    if (!email || !password || !confirmPassword ) {
      setResultMessage("All fields are required");
      setResultType("error");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setResultMessage("Please check your password");
      setResultType("error");
      return;
    }

    // Success message for now (until backend is ready)
    setResultMessage("Registration successful!");
    setResultType("success");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    // setCompanyName("");

    // Redirect to login page after 2 seconds
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }
  return (
    <div className={styles.container}>
      <div className={styles.register}>
        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <h1>Register as Recruiter</h1>

          {/* <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          /> */}

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
    </div>
  );
}
