"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import brightStyles from "./page.bright.module.css";
import darkStyles from "./page.dark.module.css";
// import { handleLoginSubmit } from "@/utils/loginHandler";
// import Image from "next/image";
import Navbar from "@/components/navbar/Navbar_candidate";
import Jobcard from "@/components/Jobcard";

type JobItem = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity?: number | null;
    direct_contact?: string | null;
    image_url?: string | null;
    description: string;
    requirements?: string;
    jd_file_path?: string | null;
};

export default function CandidatePage() {
    const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("All Jobs"); // Trạng thái filter
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái mở/đóng modal
    const [file, setFile] = useState<File | null>(null); // Lưu trữ file CV được chọn
    const [displayName, setDisplayName] = useState("Candidate");
    const [candidateId, setCandidateId] = useState<number | null>(null);
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [candidateName, setCandidateName] = useState("");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [candidatePhone, setCandidatePhone] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [theme, setTheme] = useState<"bright" | "dark">("dark");
    const [showAllCategories, setShowAllCategories] = useState(false);
    const searchParams = useSearchParams();

    const styles = theme === "dark" ? darkStyles : brightStyles;

    const allCategories = [
        "All Jobs",
        "FrontEnd",
        "BackEnd",
        "Full Stack",
        "Mobile Developer",
        "DevOps/Cloud",
        "QA/Testing",
        "AI/ML",
        "Data Scientist",
        "Data Analyst",
        "Big Data Engineer",
        "Database Admin",
        "System Admin",
        "Cybersecurity",
        "UI/UX Designer",
        "Software Architect",
        "Engineering Manager",
        "Business Analyst",
        "Technical Writer",
    ];

    const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 6);

    const filteredJobs = useMemo(() => {
        const byCategory = selectedCategory === "All Jobs" || selectedCategory === "All"
            ? jobs
            : jobs.filter(job => job.title.includes(selectedCategory));

        const q = searchQuery.trim().toLowerCase();
        if (!q) return byCategory;

        return byCategory.filter(job => job.title.toLowerCase().includes(q));
    }, [selectedCategory, searchQuery, jobs]);

    useEffect(() => {
        const qsTheme = searchParams.get("theme");
        setTheme(qsTheme === "bright" ? "bright" : "dark");
    }, [searchParams]);

    useEffect(() => {
        const currentUserRaw = localStorage.getItem("currentUser");
        if (!currentUserRaw) return;

        try {
            const currentUser = JSON.parse(currentUserRaw);
            if (typeof currentUser?.user_id === "number") {
                setCandidateId(currentUser.user_id);
            }
            const email = currentUser?.email || currentUser?.user?.email;
            if (typeof email === "string" && email.includes("@")) {
                setDisplayName(email.split("@")[0]);
                setCandidateEmail(email);
            }
        } catch {
            setDisplayName("Candidate");
        }
    }, []);

    useEffect(() => {
        fetch("http://localhost:8000/api/jobs/")
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Failed to load jobs");
                }
                setJobs(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setJobs([]);
            });
    }, []);

    // onClick cho job cards
    const handleClickjob = (jobData: JobItem) => {
        setSelectedJob(jobData);
        console.log("Selected Job:", jobData.title);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFile(null); // Reset file khi đóng modal
        setAdditionalInfo("");
    };

    async function handleApply(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !selectedJob) {
            alert("Please attach your CV!");
            return;
        }

        if (!candidateName || !candidateEmail || !candidatePhone) {
            alert("Please fill all candidate fields.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("job_id", String(selectedJob.id));
            formData.append("candidate_name", candidateName);
            formData.append("candidate_email", candidateEmail);
            formData.append("candidate_phone", candidatePhone);
            if (candidateId !== null) {
                formData.append("candidate_id", String(candidateId));
            }
            formData.append("cv_file", file);

            const response = await fetch("http://localhost:8000/api/cvs/upload-cv", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to submit CV");
            }

            alert(`Application submitted successfully for ${selectedJob.title}`);
            handleCloseModal();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to submit CV");
        }
    }

    return (
        <main>
            <div className={styles.container}>
                <Navbar />
                <div className={styles.left}>
                        <div className={styles.leftTopBox}>
                            <div className={styles.leftTop}>
                                <p className={styles.Linktext}>Job Title</p>
                            </div>
                        </div>
                    <div className={styles.leftMiddleBox}>
                        <div className={styles.searchRowLeft}>
                            <input
                                className={styles.searchInput}
                                type="text"
                                placeholder="Search job by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className={styles.searchHint}>{filteredJobs.length} jobs found</span>
                        </div>
                        <div className={styles.leftMiddle}>
                            {visibleCategories.map((category) => (
                                <p 
                                    key={category}
                                    className={styles.Linktext} 
                                    onClick={() => setSelectedCategory(category)} 
                                    style={{cursor: "pointer", fontWeight: selectedCategory === category ? "bold" : "normal"}}
                                >
                                    {category}
                                </p>
                            ))}
                            <button
                                onClick={() => setShowAllCategories(!showAllCategories)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#0ea5e9",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    marginTop: "8px",
                                    padding: "0",
                                }}
                            >
                                {showAllCategories ? "▼" : "▶"}
                            </button>
                        </div>
                    </div>
                    <div className={styles.leftBottomBox}>
                        <div className={styles.leftBottomUser}>
                            <div className={styles.avatarCircle} title={displayName}>
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userMeta}>
                                <p className={styles.userName}>{displayName}</p>
                                <Link className={styles.logoutLink} href="/login">Logout</Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.middle}>
                    <div className={styles.jobList}>
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map(job => (
                                <Jobcard 
                                    key={job.id} 
                                    job={job} 
                                    isActive={selectedJob?.id === job.id} 
                                    onClick={() => handleClickjob(job)} 
                                />
                            ))
                        ) : (
                            <p style={{ textAlign: "center", marginTop: "20px" }}>No jobs found in this category.</p>
                        )}
                    </div>
                </div>

                <div className={styles.right}>
                    {selectedJob ? (
                        <div className={styles.jobDetails}>
                            {selectedJob.image_url && (
                                <img src={selectedJob.image_url} alt={selectedJob.title} className={styles.detailsImage} />
                            )}
                            
                            <h2 className={styles.detailsTitle}>{selectedJob.title}</h2>
                            <p className={styles.detailsMeta}>
                                {selectedJob.level} | {selectedJob.location} | Quantity: {selectedJob.quantity ?? "-"}
                            </p>
                            
                            <div className={styles.detailsSection}>
                                <h4>Short Description:</h4>
                                <p>{selectedJob.description}</p>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>Requirements / Deadline:</h4>
                                <p>Deadline: <strong>{selectedJob.deadline}</strong></p>
                                <p>Direct contact: <strong>{selectedJob.direct_contact || "N/A"}</strong></p>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>Job Description File:</h4>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {selectedJob.jd_file_path && (
                                        <>
                                            <a 
                                                href={`http://localhost:8000/api/jobs/${selectedJob.id}/jd-file`} 
                                                download
                                                className={styles.applyButton}
                                                style={{ textDecoration: "none" }}
                                            >
                                                📥 Download JD
                                            </a>
                                            <a 
                                                href={`http://localhost:8000/api/jobs/${selectedJob.id}/jd-file?inline=true`} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.applyButton}
                                                style={{ textDecoration: "none" }}
                                            >
                                                👁️ View JD
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Đổi thẻ Link thành button mở Modal */}
                            <button onClick={() => setIsModalOpen(true)} className={styles.applyButton}>
                                Recruit Now!
                            </button>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyText}>Select a job to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Popup ứng tuyển nộp CV */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button className={styles.closeBtn} onClick={handleCloseModal}>✕</button>
                        
                        <div className={styles.modalHeader}>
                            <h2>Send us your CV here</h2>
                            <p>If you have any questions, please contact us through the contact information, or fill in the form below.</p>
                        </div>

                        <form onSubmit={handleApply}>
                            <div className={styles.modalBody}>
                                {/* Cột Trái: Các Form nhập liệu */}
                                <div className={styles.modalFormCol}>
                                    <input
                                        className={styles.modalInput}
                                        type="text"
                                        placeholder="Full Name"
                                        value={candidateName}
                                        onChange={(e) => setCandidateName(e.target.value)}
                                        required
                                    />
                                    <input
                                        className={styles.modalInput}
                                        type="email"
                                        placeholder="Email"
                                        value={candidateEmail}
                                        onChange={(e) => setCandidateEmail(e.target.value)}
                                        required
                                    />
                                    <div className={styles.phoneGroup}>
                                        <div className={styles.phonePrefix}>🇻🇳 +84</div>
                                        <input
                                            className={styles.modalInput}
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={candidatePhone}
                                            onChange={(e) => setCandidatePhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <input 
                                        className={styles.modalInput} 
                                        type="text" 
                                        value={selectedJob?.title || ""} 
                                        readOnly 
                                        style={{ background: "#f9f9f9", opacity : 0.8}} 
                                    />
                                    <textarea
                                        className={styles.modalInput}
                                        rows={4}
                                        placeholder="Additional Information"
                                        value={additionalInfo}
                                        onChange={(e) => setAdditionalInfo(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Cột Phải: Upload File */}
                                <div className={styles.modalUploadCol}>
                                    <input 
                                        type="file" 
                                        className={styles.fileInput} 
                                        onChange={handleFileChange}
                                        accept=".pdf, .jpeg, .jpg, .png" 
                                        required 
                                    />
                                    <div className={styles.uploadIcon}>☁️</div>
                                    {file ? (
                                        <p className={styles.uploadText} style={{ color: "green" }}>
                                            ✓ Selected: {file.name}
                                        </p>
                                    ) : (
                                        <>
                                            <p className={styles.uploadText}>
                                                <span>Upload</span> CV here
                                            </p>
                                            <p className={styles.uploadSubText}>
                                                Only accepts pdf, jpeg, jpg, png files up to 5mb
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="submit" className={styles.submitModalBtn}>Apply Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ---------- KẾT THÚC: MODAL ỨNG TUYỂN ---------- */}
        </main>
    )
}
