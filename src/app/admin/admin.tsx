"use client"

import { useState } from "react";
import styles from "./admin.module.css";
import { Link } from "next/link";
import { handleAdminLogin } from "@/utils/adminLoginHandler";

export default function AdminPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [resultMessage, setResultMessage] = useState("");
    const [resultType, setResultType] = useState<"success" | "error" | "">("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        handleAdminLogin(username, password, {
            setUsername,
            setPassword,
            setUsernameError,
            setPasswordError,
            setResultMessage,
            setResultType,
        });
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
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e)} => setPassword(e.target.value)}
