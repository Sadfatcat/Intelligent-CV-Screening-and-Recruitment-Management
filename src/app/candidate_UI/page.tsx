"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
// import { handleLoginSubmit } from "@/utils/loginHandler";
// import Image from "next/image";
import Navbar from "@/components/navbar/Navbar_candidate";
import Jobcard from "@/components/Jobcard";

export default function CandidatePage() {
    const [selectedJob, setSelectedJob] = useState<any>(null); // Trạng thái lưu trữ công việc đang được chọn
    const [selectedCategory, setSelectedCategory] = useState<string>("All"); // Trạng thái filter
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái mở/đóng modal
    const [file, setFile] = useState<File | null>(null); // Lưu trữ file CV được chọn
    const [displayName, setDisplayName] = useState("Candidate");

    const job1 = {
        id: 1,
        title: "Data Analyst",
        level: "Mid-Level",
        location: "Ha Noi",
        deadline: "18/05/2026",
        quantity: 1,
        image: "/dataanalyse.jpeg", // Đã sửa 'src' thành 'image' để khớp với `type` của Jobcard
        description: "Have >2 year experience in data analysis"
    }
    const job2 = {
        id: 2,
        title: "BackEnd Developer",
        level: "Junior",
        location: "Ha Noi",
        deadline: "29/05/2026",
        quantity: 3,
        image: "/BE.webp",
        description: "Have >1 years experience with Node.js, Java Spring, good at Database (SQL/NoSQL) and RESTful API."
    };
    //fake data
    const job3 = {
        id: 3,
        title: "FrontEnd Developer",
        level: "Fresher",
        location: "Ha Noi",
        deadline: "10/05/2026",
        quantity: 1,
        image: "/FE.webp",
        description: "Know how to use NextJs, ReactJs, good at HTML, CSS, JavaScript"
    };
    const job4 = {
        id: 4,
        title: "AI/ML Engineer",
        level: "Senior",
        location: "Ha Noi",
        deadline: "26/07/2026",
        quantity: 2,
        image: "/AI.jpeg",
        description: "Know how to use Python, good at AI/ML concepts"
    };

    const allJobs = [job1, job2, job3, job4];
    const filteredJobs = useMemo(() => {
        const byCategory = selectedCategory === "All"
            ? allJobs
            : allJobs.filter(job => job.title.includes(selectedCategory));

        const q = searchQuery.trim().toLowerCase();
        if (!q) return byCategory;

        return byCategory.filter(job => job.title.toLowerCase().includes(q));
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        const currentUserRaw = localStorage.getItem("currentUser");
        if (!currentUserRaw) return;

        try {
            const currentUser = JSON.parse(currentUserRaw);
            const email = currentUser?.email || currentUser?.user?.email;
            if (typeof email === "string" && email.includes("@")) {
                setDisplayName(email.split("@")[0]);
            }
        } catch {
            setDisplayName("Candidate");
        }
    }, []);

    // onClick cho job cards
    const handleClickjob = (jobData: any) => {
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
    };

    return (
        <main>
            <div className={styles.container}>
                <div className={styles.navbar}>
                    <Navbar />
                </div>
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
                            <p className={styles.Linktext} onClick={() => setSelectedCategory("All")} style={{cursor: "pointer", fontWeight: selectedCategory === "All" ? "bold" : "normal"}}>All Jobs</p>
                            <p className={styles.Linktext} onClick={() => setSelectedCategory("FrontEnd")} style={{cursor: "pointer", fontWeight: selectedCategory === "FrontEnd" ? "bold" : "normal"}}>FrontEnd</p>
                            <p className={styles.Linktext} onClick={() => setSelectedCategory("BackEnd")} style={{cursor: "pointer", fontWeight: selectedCategory === "BackEnd" ? "bold" : "normal"}}>BackEnd</p>
                            <p className={styles.Linktext} onClick={() => setSelectedCategory("AI/ML")} style={{cursor: "pointer", fontWeight: selectedCategory === "AI/ML" ? "bold" : "normal"}}>AI/ML</p>
                            <p className={styles.Linktext} onClick={() => setSelectedCategory("Data Analyst")} style={{cursor: "pointer", fontWeight: selectedCategory === "Data Analyst" ? "bold" : "normal"}}>Data Analyst</p>
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
                            <img src={selectedJob.image} alt={selectedJob.title} className={styles.detailsImage} />
                            
                            <h2 className={styles.detailsTitle}>{selectedJob.title}</h2>
                            <p className={styles.detailsMeta}>
                                {selectedJob.level} | {selectedJob.location} | Quantity: {selectedJob.quantity}
                            </p>
                            
                            <div className={styles.detailsSection}>
                                <h4>Short Description:</h4>
                                <p>{selectedJob.description}</p>
                            </div>

                            <div className={styles.detailsSection}>
                                <h4>Requirements / Deadline:</h4>
                                <p>Deadline: <strong>{selectedJob.deadline}</strong></p>
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

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!file) {
                                alert("Please attach your CV!");
                                return;
                            }
                            alert(`Successfully applied for position ${selectedJob?.title} with file ${file.name}`);
                            handleCloseModal();
                        }}>
                            <div className={styles.modalBody}>
                                {/* Cột Trái: Các Form nhập liệu */}
                                <div className={styles.modalFormCol}>
                                    <input className={styles.modalInput} type="text" placeholder="Full Name" required />
                                    <input className={styles.modalInput} type="email" placeholder="Email" required />
                                    <div className={styles.phoneGroup}>
                                        <div className={styles.phonePrefix}>🇻🇳 +84</div>
                                        <input className={styles.modalInput} type="tel" placeholder="Phone Number" required />
                                    </div>
                                    <input 
                                        className={styles.modalInput} 
                                        type="text" 
                                        value={selectedJob?.title || ""} 
                                        readOnly 
                                        style={{ background: "#f9f9f9", opacity : 0.8}} 
                                    />
                                    <textarea className={styles.modalInput} rows={4} placeholder="Additional Information"></textarea>
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
