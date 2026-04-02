"use client"

// import { useState } from "react";
// import { useEffect } from "react";
// import Link from "next/link";
import styles from "./page.module.css";
// import { handleLoginSubmit } from "@/utils/loginHandler";
// import Image from "next/image";
import Navbar from "@/components/navbar/Navbar_recruiter";

export default function RecruiterPage() {
    return (
        <main>
            <div className={styles.container}>
                <div className={styles.navbar}>
                    <Navbar />
                </div>
                <div className={styles.left}>
                    <div className={styles.leftTop}>

                    </div>
                    <p className={styles.Linktext}>FrontEnd</p>
                    <p className={styles.Linktext}>BackEnd</p>
                    <p className={styles.Linktext}>AI/ML</p>
                    <p className={styles.Linktext}>Data Analyst</p>
                </div>
                <div className={styles.middle}>

                </div>

                <div className={styles.right}>

                </div>
            </div>
        </main>
    )
}