"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { handleAdminLogin } from "@/utils/adminLoginHandler";

export default function AdminPage() {
    const router = useRouter(); // Khởi tạo router chuyển trang
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [resultMessage, setResultMessage] = useState("");
    const [resultType, setResultType] = useState<"success" | "error" | "">("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // 1. Reset all error states before checking
        setUsernameError("");
        setPasswordError("");
        setResultMessage("");
        setResultType("");

        // 2. Only send inputs to handler and get the returned result
        const result = handleAdminLogin(username, password);

        // 3. UI logic handles success or errors based on the returned result
        if (result.success) {
            setResultMessage(result.message!);
            setResultType("success");
            router.push("/admin/dashboard"); // Redirect only on valid login
        } else {
            setResultType("error");
            if (result.errorType === "username") setUsernameError(result.message!);
            if (result.errorType === "password") setPasswordError(result.message!);
            if (result.errorType === "system") setResultMessage(result.message!);
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

                    <a href="/admin/register" style={{ marginTop: "1rem", display: "inline-block", color: "#0070f3", textDecoration: "none", fontSize: "0.9rem" }}>
                        Don't have a business account? Register now
                    </a>
                </form>
            </div>
        </div>
    );
}