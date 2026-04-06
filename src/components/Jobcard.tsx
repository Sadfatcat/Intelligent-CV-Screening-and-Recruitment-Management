"use client"

type JobCardProps = {
    job: {
        id: number;
        title: string;
        level: string;
        location: string;
        deadline: string;
        quantity: number;
        image: string;
        description: string;
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
            <img
                src={job.image}
                alt={job.title}
                className={styles.image}
            />

            <h3 className={styles.title}>{job.title}</h3>

            <p className={styles.text}>
                <span className={styles.label}>Level:</span> {job.level} - <span className={styles.label}>Location:</span> {job.location}
            </p>

            <p className={styles.text}>
                <span className={styles.label}>Deadline:</span> {job.deadline}
            </p>

            <p className={styles.text}>
                <span className={styles.label}>Quantity:</span> {job.quantity}
            </p>

            <p className={styles.description}>
                <span className={styles.label}>Description:</span> {job.description}
            </p>
        </div>
    );
}