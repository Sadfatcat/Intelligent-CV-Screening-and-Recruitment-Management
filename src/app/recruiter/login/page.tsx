"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecruiterLogin } from "../../../features/recruiter/components/RecruiterLogin";
import { RECRUITER_PASSWORD_CHANGE_STORAGE_KEY, RECRUITER_SESSION_STORAGE_KEY } from "../../../features/recruiter/constants/recruiterConstants";
import { loginRecruiter } from "../../../features/recruiter/services/recruiterApi";

// Recruiter Login Route: đăng nhập riêng cho tài khoản recruiter do admin tạo.
export default function RecruiterLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        setMessageType("");

        try {
            const recruiterSession = await loginRecruiter(email, password);
            localStorage.removeItem("currentUser");
            localStorage.removeItem("adminUser");

            if (recruiterSession.must_change_password) {
                localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
                localStorage.setItem(RECRUITER_PASSWORD_CHANGE_STORAGE_KEY, JSON.stringify(recruiterSession));
                router.push("/recruiter/change-password");
                return;
            }

            localStorage.removeItem(RECRUITER_PASSWORD_CHANGE_STORAGE_KEY);
            localStorage.setItem(RECRUITER_SESSION_STORAGE_KEY, JSON.stringify(recruiterSession));
            router.push("/recruiter_UI");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Cannot login");
            setMessageType("error");
        }
    }

    return (
        <RecruiterLogin
            email={email}
            password={password}
            message={message}
            messageType={messageType}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
        />
    );
}
