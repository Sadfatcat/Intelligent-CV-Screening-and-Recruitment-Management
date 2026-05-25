"use client";

import Jobcard from "@/components/Jobcard";
import type { JobItem } from "../hooks/useCandidateData";
import styles from "../../../app/candidate/page.module.css";

type Props = {
    groupedJobsByCompany: [string, JobItem[]][];
    selectedJobId?: number | null;
    onSelectJob: (job: JobItem) => void;
};

export default function JobBrowsePage({ groupedJobsByCompany, selectedJobId, onSelectJob }: Props) {
    if (groupedJobsByCompany.length === 0) {
        return <p style={{ textAlign: "center", marginTop: "20px" }}>No jobs found in this category.</p>;
    }

    return (
        <div className={styles.companySections}>
            {groupedJobsByCompany.map(([companyName, companyJobs]) => (
                <section key={companyName} className={styles.companySection}>
                    <div className={styles.companyHeader}>
                        <h3>{companyName}</h3>
                        <span>{companyJobs.length} jobs</span>
                    </div>
                    <div className={styles.companyJobList}>
                        {companyJobs.map((job) => (
                            <Jobcard
                                key={job.id}
                                job={job}
                                isActive={selectedJobId === job.id}
                                onClick={() => onSelectJob(job)}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
