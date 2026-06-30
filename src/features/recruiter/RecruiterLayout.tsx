"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RecruiterSidebar } from "./components/RecruiterSidebar";
import { RecruiterToast } from "./components/RecruiterToast";
import { RecruiterUploadJDModal } from "./components/RecruiterUploadJDModal";
import { clearAuthSession } from "@/utils/authSession";
import { ENABLE_DEV_MOCK_DATA } from "./constants/recruiterConstants";
import { useRecruiterData } from "./hooks/useRecruiterData";
import CVDetailPage from "./pages/CVDetailPage";
import DashboardPage from "./pages/DashboardPage";
import JobManagementPage from "./pages/JobManagementPage";
import SubmittedCVsPage from "./pages/SubmittedCVsPage";
import {
    deleteApplication,
    fetchRecruiterCvLogs,
    fetchRecruiterJobs,
    updateRecruiterJobStatus,
} from "./services/recruiterApi";
import type { CVLogItem, JobManagementStatus, RecruiterJob } from "./types/recruiterTypes";
import { MOCK_FINT_CV_LOGS, MOCK_RECRUITER_JOBS, isFintSession } from "./utils/recruiterMockMappers";
import styles from "../../app/recruiter_UI/page.module.css";

type ActivePage = "dashboard" | "jobs" | "cvs" | "cv-detail";
type DashboardRange = "7d" | "30d" | "all";

type RecruiterLayoutProps = {
    defaultPage?: ActivePage;
};

export default function RecruiterLayout({ defaultPage = "dashboard" }: RecruiterLayoutProps) {
    const router = useRouter();
    const {
        session,
        setSession,
        isSessionChecked,
        jobs,
        setJobs,
        loadJobs,
        cvLogs,
        setCvLogs,
        loadCvLogs,
        companyName,
        isScreeningLoading,
        screeningError,
        storedFintCvLogs,
    } = useRecruiterData();

    const [activePage, setActivePage] = useState<ActivePage>(defaultPage);
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
    const [selectedScreeningLog, setSelectedScreeningLog] = useState<CVLogItem | null>(null);
    const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
    const [isScoringSummaryOpen, setIsScoringSummaryOpen] = useState(false);
    const [dashboardRange, setDashboardRange] = useState<DashboardRange>("7d");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const recruiterCvDetailHistoryRef = useRef(false);

    useEffect(() => {
        if (!message) return;
        const timer = window.setTimeout(() => { setMessage(""); setMessageType(""); }, 4200);
        return () => window.clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        if (isSessionChecked && !session) {
            router.replace("/login");
        }
    }, [isSessionChecked, router, session]);

    useEffect(() => {
        function handlePopState() {
            if (!recruiterCvDetailHistoryRef.current) return;
            recruiterCvDetailHistoryRef.current = false;
            setSelectedScreeningLog(null);
            setActivePage("cvs");
        }
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    function showMessage(msg: string, type: "success" | "error") {
        setMessage(msg);
        setMessageType(type);
    }

    const isFintRecruiter = ENABLE_DEV_MOCK_DATA && isFintSession(session, companyName);

    const recruiterJobs: RecruiterJob[] = useMemo(
        () => (isFintRecruiter ? [...jobs, ...MOCK_RECRUITER_JOBS] : jobs),
        [isFintRecruiter, jobs]
    );

    const getManagedJobStatus = useCallback(
        (jobId: number): JobManagementStatus => recruiterJobs.find((job) => job.id === jobId)?.status ?? "active",
        [recruiterJobs]
    );

    const recruiterCvLogs: CVLogItem[] = useMemo(
        () => (isFintRecruiter ? [...cvLogs, ...storedFintCvLogs, ...MOCK_FINT_CV_LOGS] : cvLogs),
        [cvLogs, isFintRecruiter, storedFintCvLogs]
    );

    const managedRecruiterJobs: RecruiterJob[] = useMemo(
        () =>
            recruiterJobs
                .filter((job) => getManagedJobStatus(job.id) !== "deleted")
                .sort((a, b) => {
                    const aOff = getManagedJobStatus(a.id) === "turned_off" ? 1 : 0;
                    const bOff = getManagedJobStatus(b.id) === "turned_off" ? 1 : 0;
                    return aOff - bOff;
                }),
        [getManagedJobStatus, recruiterJobs]
    );

    const companyLabel = useMemo(() => {
        const fromSession = session?.company_name;
        if (fromSession?.trim()) return fromSession;
        const fromJob = recruiterJobs[0]?.company_name;
        if (fromJob?.trim()) return fromJob;
        const fromEmail = session?.email;
        if (fromEmail?.includes("@")) return fromEmail.split("@")[0];
        return "Recruiter";
    }, [recruiterJobs, session]);

    async function setManagedJobStatus(jobId: number, status: JobManagementStatus) {
        if (!session) return;
        const job = recruiterJobs.find((item) => item.id === jobId);
        if (job?.isMock) {
            showMessage("Mock job status changes are not saved to backend.", "error");
            return;
        }
        try {
            await updateRecruiterJobStatus(session.user_id, jobId, status);
            setJobs(await fetchRecruiterJobs(session.user_id));
            setCvLogs(await fetchRecruiterCvLogs(session.user_id));
            showMessage(
                status === "turned_off" ? "Job turned off."
                    : status === "active" ? "Job restored to the active list."
                        : status === "deleted" ? "Job deleted."
                            : "Job status updated.",
                "success"
            );
        } catch (err) {
            showMessage(err instanceof Error ? err.message : "Update job status failed", "error");
        }
    }

    async function handleDeleteSelectedCv(log: CVLogItem) {
        if (!session) return;
        if (log.isMock) {
            showMessage("Mock CV records cannot be deleted from backend.", "error");
            return;
        }
        const label = log.candidate_name?.trim() || `application #${log.application_id}`;
        if (!window.confirm(`Delete CV for ${label}? This removes the submitted CV record from recruiter views.`)) return;
        try {
            await deleteApplication(session.user_id, log.application_id);
            setCvLogs(await fetchRecruiterCvLogs(session.user_id));
            setSelectedScreeningLog(null);
            setActivePage("cvs");
            showMessage("Submitted CV deleted successfully.", "success");
        } catch (err) {
            showMessage(err instanceof Error ? err.message : "Delete CV failed", "error");
        }
    }

    function handleLogout() {
        clearAuthSession();
        setSession(null);
        router.push("/login");
    }

    function openScreeningDetail(log: CVLogItem) {
        if (typeof window !== "undefined" && !recruiterCvDetailHistoryRef.current) {
            window.history.pushState({ ...(window.history.state ?? {}), intelliCvRecruiterCvDetail: true }, "", window.location.href);
            recruiterCvDetailHistoryRef.current = true;
        }
        setSelectedScreeningLog(log);
        setSelectedJobId(log.job_id);
        setActivePage("cv-detail");
    }

    function handleBackFromDetail() {
        if (typeof window !== "undefined" && recruiterCvDetailHistoryRef.current) {
            window.history.back();
            return;
        }
        setSelectedScreeningLog(null);
        setActivePage("cvs");
    }

    function openApplicationsForJob(jobId: number) {
        setSelectedJobId(jobId);
        setSelectedScreeningLog(null);
        setActivePage("cvs");
        router.push("/recruiter/applications");
    }

    const pageTitle =
        activePage === "jobs" ? "Job Management"
            : activePage === "cvs" || activePage === "cv-detail" ? "Submitted CV Management"
                : "Recruiter Dashboard";

    const pageSubtitle =
        activePage === "jobs" ? "Create, search, and manage uploaded job descriptions."
            : activePage === "cvs" || activePage === "cv-detail" ? "Review submitted CVs, matching scores, and candidate details."
                : "Overview analytics for jobs, applications, screening results, and recent activity.";

    if (!session) {
        return <div className={styles.page} />;
    }

    return (
        <div className={styles.dashboardContainer}>
            <RecruiterSidebar
                companyLabel={companyLabel}
                email={session.email}
                activeWorkspace={
                    activePage === "dashboard" ? "overview"
                        : activePage === "jobs" ? "jobs"
                            : "applications"
                }
                onOpenDashboard={() => {
                    setActivePage("dashboard");
                    setSelectedScreeningLog(null);
                    router.push("/recruiter_UI");
                }}
                onOpenJobs={() => {
                    setActivePage("jobs");
                    setSelectedScreeningLog(null);
                    setIsScoringSummaryOpen(false);
                    router.push("/recruiter/jobs");
                }}
                onOpenApplications={() => {
                    setActivePage("cvs");
                    setSelectedScreeningLog(null);
                    setIsScoringSummaryOpen(false);
                    router.push("/recruiter/applications");
                }}
                onOpenUpload={() => setIsUploadPopupOpen(true)}
                onLogout={handleLogout}
            />

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>{pageTitle}</h1>
                    <p>{pageSubtitle}</p>
                </header>

                <main className={styles.contentArea}>
                    <RecruiterToast message={message} type={messageType} />

                    {activePage === "dashboard" && (
                        <DashboardPage
                            recruiterCvLogs={recruiterCvLogs}
                            managedRecruiterJobs={managedRecruiterJobs}
                            getManagedJobStatus={getManagedJobStatus}
                            dashboardRange={dashboardRange}
                            onSetDashboardRange={setDashboardRange}
                            onOpenJobs={() => { setActivePage("jobs"); router.push("/recruiter/jobs"); }}
                            onOpenApplicationsForJob={openApplicationsForJob}
                            onOpenApplications={() => { setActivePage("cvs"); router.push("/recruiter/applications"); }}
                        />
                    )}

                    {activePage === "jobs" && (
                        <JobManagementPage
                            managedRecruiterJobs={managedRecruiterJobs}
                            recruiterCvLogs={recruiterCvLogs}
                            getManagedJobStatus={getManagedJobStatus}
                            onOpenUpload={() => setIsUploadPopupOpen(true)}
                            onSelectJob={(jobId) => {
                                setSelectedJobId(jobId);
                                setIsScoringSummaryOpen(true);
                            }}
                            onTurnOff={(jobId) => void setManagedJobStatus(jobId, "turned_off")}
                            onRestore={(jobId) => void setManagedJobStatus(jobId, "active")}
                            onDelete={(jobId, jobTitle) => {
                                const label = jobTitle?.trim() ?? "this job";
                                if (!window.confirm(`Delete "${label}" from job management? Submitted CV history will be preserved.`)) return;
                                void setManagedJobStatus(jobId, "deleted");
                                if (selectedJobId === jobId) setSelectedJobId(null);
                            }}
                            selectedJobId={selectedJobId}
                            isScoringSummaryOpen={isScoringSummaryOpen}
                            onCloseSummary={() => setIsScoringSummaryOpen(false)}
                        />
                    )}

                    {activePage === "cvs" && (
                        <>
                            <nav className={styles.subTabs} aria-label="Submitted CV views">
                                <button
                                    className={`${styles.subTabButton} ${styles.subTabButtonActive}`}
                                    type="button"
                                    onClick={() => { setActivePage("jobs"); router.push("/recruiter/jobs"); setSelectedScreeningLog(null); }}
                                >
                                    Job Management
                                </button>
                                <button
                                    className={`${styles.subTabButton} ${styles.subTabButtonActive}`}
                                    type="button"
                                    disabled
                                >
                                    Submitted CVs
                                </button>
                            </nav>
                            <SubmittedCVsPage
                                submittedCvLogs={recruiterCvLogs}
                                isScreeningLoading={isScreeningLoading}
                                screeningError={screeningError}
                                onSelectLog={openScreeningDetail}
                                onBackToJobs={() => { setActivePage("jobs"); router.push("/recruiter/jobs"); }}
                            />
                        </>
                    )}

                    {activePage === "cv-detail" && selectedScreeningLog && (
                        <CVDetailPage
                            selectedLog={selectedScreeningLog}
                            getManagedJobStatus={getManagedJobStatus}
                            onBack={handleBackFromDetail}
                            onDelete={(log) => void handleDeleteSelectedCv(log)}
                            session={session}
                        />
                    )}

                    {activePage === "cv-detail" && !selectedScreeningLog && (
                        <p className={styles.tableState}>Please select a CV to view details.</p>
                    )}

                    {isUploadPopupOpen && (
                        <RecruiterUploadJDModal
                            companyLabel={companyLabel}
                            session={session}
                            onClose={() => setIsUploadPopupOpen(false)}
                            onJobsChanged={async () => {
                                setJobs(await fetchRecruiterJobs(session.user_id));
                                setCvLogs(await fetchRecruiterCvLogs(session.user_id));
                            }}
                            onMessage={showMessage}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
