"use client";

import { useState } from "react";
import { uploadJobDescription } from "../services/recruiterApi";
import type { RecruiterSession } from "../types/recruiterTypes";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    companyLabel: string;
    session: RecruiterSession;
    onClose: () => void;
    onJobsChanged: () => void;
    onMessage: (msg: string, type: "success" | "error") => void;
};

export function RecruiterUploadJDModal({ companyLabel, session, onClose, onJobsChanged, onMessage }: Props) {
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [level, setLevel] = useState("Junior");
    const [deadline, setDeadline] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [salary, setSalary] = useState("");
    const [directContact, setDirectContact] = useState("");
    const [description, setDescription] = useState("");
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    async function handleUploadJD(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!jdFile) {
            onMessage("Please choose a JD PDF file", "error");
            return;
        }
        try {
            await uploadJobDescription({
                recruiterId: session.user_id,
                title,
                location,
                level,
                deadline,
                quantity,
                salary,
                directContact,
                description,
                jdFile,
                coverImageFile,
            });
            onMessage("JD uploaded successfully. Job card created.", "success");
            onClose();
            onJobsChanged();
        } catch (err) {
            onMessage(err instanceof Error ? err.message : "Upload JD failed", "error");
        }
    }

    return (
        <div className={styles.popupOverlay}>
            <div className={`${styles.popupCard} ${styles.uploadDrawerCard}`}>
                <button className={styles.popupClose} type="button" onClick={onClose}>×</button>
                <div className={styles.popupHeader}>
                    <h3>Create Job Card + Upload JD</h3>
                    <p>Fill in details and upload JD PDF.</p>
                </div>
                <form onSubmit={handleUploadJD}>
                    <div className={styles.modalBody}>
                        <div className={styles.modalFormCol}>
                            <input className={styles.modalInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" required />
                            <input className={styles.modalInput} value={companyLabel} placeholder="Company name" readOnly />
                            <input className={styles.modalInput} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Work location" required />
                            <div className={styles.modalRow}>
                                <input className={styles.modalInput} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level" required />
                                <input className={styles.modalInput} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                            </div>
                            <div className={styles.modalRow}>
                                <input className={styles.modalInput} type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} placeholder="Quantity" required />
                                <input className={styles.modalInput} value={directContact} onChange={(e) => setDirectContact(e.target.value)} placeholder="Direct contact" required />
                            </div>
                            <input className={styles.modalInput} value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary, e.g. 15-25 million VND or Negotiable" required />
                            <textarea className={styles.modalInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job description" required />
                        </div>
                        <div className={styles.modalUploadStack}>
                            <div className={styles.modalUploadCol}>
                                <input className={styles.fileInput} type="file" accept=".pdf" onChange={(e) => setJdFile(e.target.files?.[0] ?? null)} required />
                                <div className={styles.uploadIcon}>PDF</div>
                                {jdFile ? (
                                    <p className={styles.uploadText}>Selected: {jdFile.name}</p>
                                ) : (
                                    <>
                                        <p className={styles.uploadText}><span>Upload</span> JD PDF here</p>
                                        <p className={styles.uploadSubText}>Only PDF files are accepted</p>
                                    </>
                                )}
                            </div>
                            <div className={styles.modalUploadCol}>
                                <input className={styles.fileInput} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setCoverImageFile(e.target.files?.[0] ?? null)} />
                                <div className={styles.uploadIcon}>Image</div>
                                {coverImageFile ? (
                                    <p className={styles.uploadText}>Cover: {coverImageFile.name}</p>
                                ) : (
                                    <>
                                        <p className={styles.uploadText}><span>Upload</span> Cover Image</p>
                                        <p className={styles.uploadSubText}>Optional: jpg, jpeg, png, webp</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <button className={styles.button} type="submit">Create Job Card & Upload JD</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
