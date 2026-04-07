"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function AdminRegisterPage() {
    const router = useRouter();
    // Cơ bản
    const [companyName, setCompanyName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // Nâng cao
    const [taxCode, setTaxCode] = useState("");
    const [address, setAddress] = useState("");
    const [industry, setIndustry] = useState("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const newAdminData = {
            companyName,
            username,
            email,
            phone,
            taxCode,
            address,
            industry,
            password
        };

        // Lưu thông tin vào localStorage để dùng sau này (như ở trang dashboard)
        localStorage.setItem("adminData", JSON.stringify(newAdminData));

        console.log("Registered:", newAdminData);
        
        router.push("/admin/dashboard");
    }

    return (
        <div className={styles.container}>
            <form className={styles.formContainer} onSubmit={handleSubmit}>
                {/* Khung 1: Thông tin cơ bản */}
                <div className={styles.glassPanel}>
                    <h2>Basic Information</h2>
                    
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                </div>

                {/* Khung 2: Thông tin doanh nghiệp nâng cao */}
                <div className={styles.glassPanel}>
                    <h2>Company Information</h2>
                    
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Tax Code" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitBtn}>Confirm & Register</button>
                        <Link href="/admin/login" className={styles.loginLink}>
                            Already have an account? Login here
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
