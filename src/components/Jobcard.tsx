"use client"

// --- ĐIỂM SỬA CHỮA (FE CẦN KHỚP VỚI CẤU TRÚC BE models.py) ---
// Đã Giữ lại: id, title, location, description
// Đã Thêm mới: company_name, requirements (từ BE đẩy lên)
// Đã Loại bỏ: deadline, quantity, image, level (Vì CSDL BE hiện tại không chứa các cột này)

type JobCardProps = {
    job: {
        id: number;
        title: string;
        company_name: string;
        location: string;
        level: string;
        deadline: string;
        quantity?: number | null;
        salary?: string | null;
        direct_contact?: string | null;
        image_url?: string;
        description: string;
        requirements?: string;
    };
    onClick?: () => void;
    isActive?: boolean;
};

import { useState } from "react";
import styles from "./Jobcard.module.css";
import { normalizeJobImageUrl } from "@/features/candidate/utils/candidateJobAssets";

export default function JobCard({
    job,
    onClick,
    isActive = false,
}: JobCardProps) {
    const imageUrl = normalizeJobImageUrl(job.image_url);
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <div
            onClick={onClick}
            className={isActive ? `${styles.jobCard} ${styles.active}` : styles.jobCard}
            style={{
                cursor: onClick ? "pointer" : "default",
            }}
        >
            {imageUrl && !imageFailed && (
                <img src={imageUrl} alt={job.title} className={styles.image} onError={() => setImageFailed(true)} />
            )}

            <h3 className={styles.title}>{job.title}</h3>
            
            {/* Phân cột hiển thị tên công ty */}
            <h4 style={{ color: "#666", marginBottom: "10px" }}>{job.company_name}</h4>

            <p className={styles.text}>
                <span className={styles.label}>Level:</span> {job.level} - <span className={styles.label}>Location:</span> {job.location}
            </p>

            <p className={styles.text}>
                <span className={styles.label}>Deadline:</span> {job.deadline}
            </p>

            <p className={styles.text}>
                <span className={styles.label}>Quantity:</span> {job.quantity ?? "-"}
            </p>

            <p className={styles.salary}>
                <span className={styles.label}>Salary:</span> {job.salary || "-"}
            </p>

            <p className={styles.text}>
                <span className={styles.label}>Direct contact:</span> {job.direct_contact || "N/A"}
            </p>

        </div>
    );
}
