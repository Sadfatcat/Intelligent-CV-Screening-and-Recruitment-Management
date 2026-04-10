"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type RecruiterUser = {
  user_id: number;
  role: string;
};

type Job = {
  id: number;
  title: string;
  company_name: string;
  location: string;
  level: string;
  deadline: string;
};

type Application = {
  application_id: number;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  ai_matching_score: number | null;
  cv_id: number | null;
  candidate_name: string | null;
  candidate_email: string | null;
  candidate_phone: string | null;
};

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const [recruiter, setRecruiter] = useState<RecruiterUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const raw = localStorage.getItem("recruiterUser") || localStorage.getItem("currentUser");
    if (!raw) {
      router.push("/recruiter/login");
      return;
    }

    const data = JSON.parse(raw);
    if (data.role !== "recruiter") {
      router.push("/recruiter/login");
      return;
    }

    setRecruiter(data);
  }, [router]);

  useEffect(() => {
    async function loadJobs() {
      if (!recruiter) return;
      try {
        const response = await fetch(`http://localhost:8000/api/recruiter/${recruiter.user_id}/jobs`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Không tải được danh sách JD");

        setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Không tải được danh sách JD");
        setMessageType("error");
      }
    }

    loadJobs();
  }, [recruiter]);

  useEffect(() => {
    async function loadApplications() {
      if (!recruiter || !selectedJobId) {
        setApplications([]);
        setJobTitle("");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/recruiter/${recruiter.user_id}/jobs/${selectedJobId}/applications`
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Không tải được applications");

        setApplications(Array.isArray(data.applications) ? data.applications : []);
        setJobTitle(data.job_title || "");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Không tải được applications");
        setMessageType("error");
      }
    }

    loadApplications();
  }, [recruiter, selectedJobId]);

  async function updateApplicationStatus(applicationId: number, status: Application["status"]) {
    if (!recruiter) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/recruiter/${recruiter.user_id}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Cập nhật trạng thái thất bại");

      setApplications((prev) =>
        prev.map((app) => (app.application_id === applicationId ? { ...app, status } : app))
      );
      setMessage("Cập nhật trạng thái thành công");
      setMessageType("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
      setMessageType("error");
    }
  }

  function handleLogout() {
    localStorage.removeItem("recruiterUser");
    router.push("/recruiter/login");
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2>Recruiter Panel</h2>
        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Recruiter Dashboard</h1>
          {message && (
            <p className={messageType === "success" ? styles.success : styles.error}>{message}</p>
          )}
        </header>

        <section className={styles.section}>
          <h3>Your Job Posts</h3>
          <div className={styles.jobGrid}>
            {jobs.map((job) => (
              <button
                key={job.id}
                className={`${styles.jobCard} ${selectedJobId === job.id ? styles.jobCardActive : ""}`}
                onClick={() => setSelectedJobId(job.id)}
              >
                <h4>{job.title}</h4>
                <p>{job.company_name}</p>
                <p>{job.location} - {job.level}</p>
                <p>Deadline: {job.deadline}</p>
              </button>
            ))}
            {jobs.length === 0 && <p>No JD yet.</p>}
          </div>
        </section>

        <section className={styles.section}>
          <h3>Applications {jobTitle ? `for ${jobTitle}` : ""}</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.application_id}>
                    <td>{app.candidate_name || "-"}</td>
                    <td>{app.candidate_email || "-"}</td>
                    <td>{app.candidate_phone || "-"}</td>
                    <td>{app.ai_matching_score ?? "-"}</td>
                    <td>{app.status}</td>
                    <td>
                      <select
                        value={app.status}
                        onChange={(e) =>
                          updateApplicationStatus(
                            app.application_id,
                            e.target.value as Application["status"]
                          )
                        }
                      >
                        <option value="pending">pending</option>
                        <option value="reviewed">reviewed</option>
                        <option value="accepted">accepted</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6}>No applications found for this JD.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
