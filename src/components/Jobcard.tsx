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
        image_url?: string;
        description: string;
        requirements: string; // Rất quan trọng để phục vụ AI screening
    };
    onClick?: () => void;
    isActive?: boolean;
};

import styles from "./Jobcard.module.css";

export default function JobCard({
    job,
    onClick,
    isActive = false,
}: JobCardProps) {
    return (
        <div
            onClick={onClick}
            className={isActive ? `${styles.jobCard} ${styles.active}` : styles.jobCard}
            style={{
                cursor: onClick ? "pointer" : "default",
            }}
        >
            {job.image_url && (
                <img src={job.image_url} alt={job.title} style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }} />
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

            <p className={styles.description}>
                <span className={styles.label}>Description:</span> {job.description}
            </p>
            
            <p className={styles.description}>
                <span className={styles.label}>Requirements:</span> {job.requirements}
            </p>
        </div>
    );
}