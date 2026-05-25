"use client";

import { useMemo, useState } from "react";
import JobCard from "../components/JobCard";
import { uploadJobDescription } from "../services/recruiterApi";
import type { CVLogItem, JobManagementStatus, RecruiterJob, RecruiterSession } from "../types/recruiterTypes";
import { calculateSummary } from "../utils/cvScoringUtils";
import { formatScore } from "../utils/recruiterFormatters";
import styles from "../../../app/recruiter_UI/page.module.css";

type Props = {
    managedRecruiterJobs: RecruiterJob[];
    recruiterCvLogs: CVLogItem[];
    session: RecruiterSession;
    companyLabel: string;
    getManagedJobStatus: (jobId: number) => JobManagementStatus;
    isUploadPopupOpen: boolean;
    onOpenUpload: () => void;
    onCloseUpload: () => void;
    onSelectJob: (jobId: number) => void;
    onTurnOff: (jobId: number) => void;
    onRestore: (jobId: number) => void;
    onDelete: (jobId: number, title?: string) => void;
    onJobsChanged: () => void;
    onMessage: (msg: string, type: "success" | "error") => void;
    selectedJobId: number | null;
    isScoringSummaryOpen: boolean;
    onCloseSummary: () => void;
};

export default function JobManagementPage({
    managedRecruiterJobs,
    recruiterCvLogs,
    session,
    companyLabel,
    getManagedJobStatus,
    isUploadPopupOpen,
    onOpenUpload,
    onCloseUpload,
    onSelectJob,
    onTurnOff,
    onRestore,
    onDelete,
    onJobsChanged,
    onMessage,
    selectedJobId,
    isScoringSummaryOpen,
    onCloseSummary,
}: Props) {
    const [jdSearchInput, setJdSearchInput] = useState("");
    const [jdSearchTerm, setJdSearchTerm] = useState("");
    const [jobPage, setJobPage] = useState(1);

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

    const filteredJobs = useMemo(() => {
        const q = jdSearchTerm.trim().toLowerCase();
        if (!q) return managedRecruiterJobs;
        return managedRecruiterJobs.filter((job) =>
            [job.title, job.company_name, job.location, job.level].filter(Boolean).join(" ").toLowerCase().includes(q)
        );
    }, [jdSearchTerm, managedRecruiterJobs]);

    const paginatedJobs = useMemo(() => {
        const start = (jobPage - 1) * 5;
        return filteredJobs.slice(start, start + 5);
    }, [filteredJobs, jobPage]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / 5));

    const selectedJob = useMemo(
        () => managedRecruiterJobs.find((j) => j.id === selectedJobId) ?? null,
        [managedRecruiterJobs, selectedJobId]
    );

    const screeningSummary = useMemo(() => {
        if (!selectedJobId) return null;
        const scopedLogs = recruiterCvLogs.filter((log) => log.job_id === selectedJobId);
        return calculateSummary(scopedLogs);
    }, [recruiterCvLogs, selectedJobId]);

    function submitSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const nextTerm = jdSearchInput.trim();
        const matches = managedRecruiterJobs.filter((job) => job.title.toLowerCase().includes(nextTerm.toLowerCase()));
        setJdSearchTerm(nextTerm);
        setJobPage(1);
        if (nextTerm && matches.length === 1) {
            onSelectJob(matches[0].id);
        }
    }

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
            setTitle("");
            setLocation("");
            setLevel("Junior");
            setDeadline("");
            setQuantity(1);
            setSalary("");
            setDirectContact("");
            setDescription("");
            setJdFile(null);
            setCoverImageFile(null);
            onCloseUpload();
            onJobsChanged();
        } catch (err) {
            onMessage(err instanceof Error ? err.message : "Upload JD failed", "error");
        }
    }

    return (
        <>
            <section className={`${styles.card} ${styles.panelCard}`} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.panelTitleRow}>
                    <div>
                        <h3>Choose JD For Screening</h3>
                        <p className={styles.subtleText}>Select, filter, add, turn off, or delete a job before viewing submitted CVs.</p>
                    </div>
                    <button className={styles.button} type="button" onClick={onOpenUpload}>Add JD</button>
                </div>

                <form className={styles.screeningFilters} onSubmit={submitSearch}>
                    <input
                        className={styles.filterInput}
                        type="search"
                        placeholder="Enter job title and press Enter to search"
                        value={jdSearchInput}
                        onChange={(e) => setJdSearchInput(e.target.value)}
                    />
                    <button className={styles.clearFilterBtn} type="submit">Search</button>
                    <button className={styles.clearFilterBtn} type="button" onClick={() => { setJdSearchInput(""); setJdSearchTerm(""); setJobPage(1); }}>Clear</button>
                </form>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>JD</th>
                                <th>Company</th>
                                <th>Level</th>
                                <th>Location</th>
                                <th>Salary</th>
                                <th>Status</th>
                                <th>CVs</th>
                                <th>Scored</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    cvLogs={recruiterCvLogs}
                                    jobStatus={getManagedJobStatus(job.id)}
                                    onClick={() => onSelectJob(job.id)}
                                    onTurnOff={() => onTurnOff(job.id)}
                                    onRestore={() => onRestore(job.id)}
                                    onDelete={() => onDelete(job.id, job.title)}
                                />
                            ))}
                            {paginatedJobs.length === 0 && (
                                <tr><td colSpan={9}>No jobs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.paginationRow}>
                    <button
                        className={styles.clearFilterBtn}
                        type="button"
                        disabled={jobPage <= 1}
                        onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                    >
                        Previous page
                    </button>
                    <span>Page {jobPage} / {totalPages}</span>
                    <button
                        className={styles.clearFilterBtn}
                        type="button"
                        disabled={jobPage >= totalPages}
                        onClick={() => setJobPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next page
                    </button>
                </div>
            </section>

            {/* Scoring Summary Popup */}
            {isScoringSummaryOpen && selectedJob && screeningSummary && (
                <div className={styles.popupOverlay}>
                    <div className={`${styles.popupCard} ${styles.summaryPopupCard}`}>
                        <button className={styles.popupClose} type="button" onClick={onCloseSummary}>×</button>
                        <div className={styles.popupHeader}>
                            <h3>{selectedJob.title}</h3>
                            <p>{selectedJob.company_name} · {selectedJob.level} · {selectedJob.location}</p>
                        </div>
                        <article className={styles.summaryJobCard}>
                            <div className={styles.summaryMetricGrid}>
                                <span>Submitted CVs<strong>{screeningSummary.total}</strong></span>
                                <span>Passed<strong>{screeningSummary.passed}</strong></span>
                                <span>Failed<strong>{screeningSummary.failed}</strong></span>
                                <span>Borderline<strong>{screeningSummary.borderline}</strong></span>
                                <span>Highest score<strong>{formatScore(screeningSummary.highestScore)}</strong></span>
                                <span>Lowest score<strong>{formatScore(screeningSummary.lowestScore)}</strong></span>
                                <span>Average score<strong>{formatScore(screeningSummary.averageScore)}</strong></span>
                            </div>
                        </article>
                    </div>
                </div>
            )}

            {/* Upload JD Modal */}
            {isUploadPopupOpen && (
                <div className={styles.popupOverlay}>
                    <div className={`${styles.popupCard} ${styles.uploadDrawerCard}`}>
                        <button className={styles.popupClose} type="button" onClick={onCloseUpload}>×</button>
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
                                        <div className={styles.uploadIcon}>☁️</div>
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
                                        <div className={styles.uploadIcon}>🖼️</div>
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
            )}
        </>
    );
}
