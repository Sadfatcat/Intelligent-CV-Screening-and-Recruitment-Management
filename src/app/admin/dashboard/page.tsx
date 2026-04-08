"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

export default function AdminDashboard() {
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [companyName, setName] = useState("");
    const [taxCode, setTaxCode] = useState("");
    const [industry, setIndustry] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Gom dữ liệu biến trạng thái (state) vào một object nếu bạn muốn truy xuất tập trung
    const companyInfo = {
        name: companyName,
        taxCode: taxCode,
        industry: industry,
        address: address,
        email: email,
        phone: phone,
    };

    const handleLogout = () => {
        router.push("/admin/login");
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <h2>Admin Panel</h2>
                </div>
                <nav className={styles.navMenu}>
                    <ul>
                        <li className={styles.active}>Dashboard</li>
                        <li>Job Management</li>
                        <li>Candidate Management</li>
                        <li>Reports & Analytics</li>
                        <li onClick={handleLogout} className={styles.logoutItem}>🚪 Logout</li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Dashboard</h1>
                    <div className={styles.headerActions}>
                        <button className={styles.settingsBtn} onClick={() => setIsSettingsOpen(true)}>
                            ⚙️ Settings
                        </button>
                    </div>
                </header>

                <main className={styles.contentArea}>
                    <div className={styles.card}>
                        <h3>No.Candidates</h3>
                        <p>150 New CVs</p>
                    </div>
                    <div className={styles.card}>
                        <h3>Recruitment Campaigns</h3>
                        <p>5 campaigns currently running</p>
                    </div>
                </main>
            </div>

            {/* Settings Modal (Popup) */}
            {isSettingsOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Company Information</h2>
                            <button className={styles.closeBtn} onClick={() => setIsSettingsOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p><strong>Company Name:</strong> {companyInfo.name}</p>
                            <p><strong>Tax Code:</strong> {companyInfo.taxCode}</p>
                            <p><strong>Industry:</strong> {companyInfo.industry}</p>
                            <p><strong>Address:</strong> {companyInfo.address}</p>
                            <p><strong>Contact Email:</strong> {companyInfo.email}</p>
                            <p><strong>Hotline:</strong> {companyInfo.phone}</p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.saveBtn} onClick={() => setIsSettingsOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
