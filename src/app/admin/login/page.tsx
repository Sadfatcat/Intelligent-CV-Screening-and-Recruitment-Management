"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function AdminPage() {
    const router = useRouter(); // Khởi tạo router chuyển trang
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [resultMessage, setResultMessage] = useState("");
    const [resultType, setResultType] = useState<"success" | "error" | "">("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // 1. Reset all error states before checking
        setUsernameError("");
        setPasswordError("");
        setResultMessage("");
        setResultType("");

        if (!username.trim()) {
            setUsernameError("Email cannot be empty");
            return;
        }
        if (!password) {
            setPasswordError("Password cannot be empty");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: username, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                setResultType("error");
                setResultMessage(data.detail || "Login failed");
                return;
            }

            if (data.role !== "admin") {
                setResultType("error");
                setResultMessage("This account does not have admin access");
                return;
            }

            localStorage.setItem("adminUser", JSON.stringify(data));
            setResultMessage("Admin login successful! Redirecting...");
            setResultType("success");
            router.push("/admin/dashboard");
        } catch {
            setResultType("error");
            setResultMessage("Cannot connect to backend");
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.admin}>
                <form className={styles.adminForm} onSubmit={handleSubmit}>
                    <h1>Admin Login</h1>
                    <p className={styles.subtitle}>Secure access to dashboard management.</p>
                    <input
                        type="text"
                        placeholder="admin email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {usernameError && <p className={styles.errorText}>{usernameError}</p>}
                    
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordError && <p className={styles.errorText}>{passwordError}</p>}
                    
                    <button type="submit" className={styles.submitBtn}>Login</button>
                    
                    {resultMessage && (
                        <p className={`${styles.resultText} ${resultType === "success" ? styles.resultSuccess : styles.resultError}`}>
                            {resultMessage}
                        </p>
                    )}

                    <p className={styles.note}>
                        Recruiter accounts are created by admin inside dashboard.
                    </p>
                </form>
            </div>
        </div>
    );
}