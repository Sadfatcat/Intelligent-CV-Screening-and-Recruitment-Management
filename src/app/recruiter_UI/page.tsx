"use client"

// import { useState } from "react";
// import { useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
// import { handleLoginSubmit } from "@/utils/loginHandler";
// import Image from "next/image";
import Navbar from "@/components/navbar/Navbar_recruiter";
import Jobcard from "@/components/Jobcard";

export default function RecruiterPage() {
    const job1 = {
        id: 1,
        title: "Data Analyst",
        level: "Middle",
        location: "Ha Noi",
        deadline: "18/05/2026",
        quantity: 1,
        image: "/dataanalyse.jpeg", // Đã sửa 'src' thành 'image' để khớp với `type` của Jobcard
        description: "Have 1 year experience in data analysis"
    }
    const job2 = {
        id: 2,
        title: "BackEnd Developer",
        level: "Middle",
        location: "Ha Noi",
        deadline: "29/05/2026",
        quantity: 3,
        image: "/BE.webp",
        description: "Have 2 years experience with Node.js, Java Spring, good at Database (SQL/NoSQL) and RESTful API."
    };
    //fake data
    const job3 = {
        id: 3,
        title: "FrontEnd Developer",
        level: "Middle",
        location: "Ha Noi",
        deadline: "10/05/2026",
        quantity: 1,
        image: "/FE.webp",
        description: "Know how to use NextJs, ReactJs, good at HTML, CSS, JavaScript"
    };
    const job4 = {
        id: 4,
        title: "AI/ML Engineer",
        level: "Middle",
        location: "Ha Noi",
        deadline: "26/07/2026",
        quantity: 2,
        image: "/AI.jpeg",
        description: "Know how to use Python, good at AI/ML concepts"
    };
    // onClick cho job cards
    const handleClickjob = (jobTitle: string) => {
        console.log(jobTitle);
    }
    return (
        <main>
            <div className={styles.container}>
                <div className={styles.navbar}>
                    <Navbar />
                </div>
                <div className={styles.left}>
                    <div className={styles.leftTop}>
                        <p className={styles.Linktext}>Job Title</p>
                    </div>
                    <div className={styles.leftMiddle}>
                        <p className={styles.Linktext}>FrontEnd</p>
                        <p className={styles.Linktext}>BackEnd</p>
                        <p className={styles.Linktext}>AI/ML</p>
                        <p className={styles.Linktext}>Data Analyst</p>
                    </div>
                    <div className={styles.leftBottom}>
                        <p className={styles.Linktext}>Settings</p>
                        <Link className={styles.Linktext} href="/login">Logout</Link>
                    </div>
                </div>
                <div className={styles.middle}>
                    <div className={styles.jobList}>
                        {/* 2. Truyền biến dữ liệu giả đó vào Jobcard */}
                        <Jobcard job={job1} onClick={() => handleClickjob(job1.title)} />
                        <Jobcard job={job2} onClick={() => handleClickjob(job2.title)} />
                        <Jobcard job={job3} />
                        <Jobcard job={job4} />
                    </div>
                </div>

                <div className={styles.right}>

                </div>
            </div>
        </main>
    )
}
