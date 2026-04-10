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
                    <input
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {usernameError && <p style={{color: "red", fontSize: "12px", margin: "0"}}>{usernameError}</p>}
                    
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordError && <p style={{color: "red", fontSize: "12px", margin: "0"}}>{passwordError}</p>}
                    
                    <button type="submit">Login</button>
                    
                    {resultMessage && (
                        <p style={{ color: resultType === "success" ? "green" : "red", fontSize: "14px", marginTop: "10px" }}>
                            {resultMessage}
                        </p>
                    )}

                    <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                        Recruiter accounts are created by admin inside dashboard.
                    </p>
                </form>
            </div>
        </div>
    );
}