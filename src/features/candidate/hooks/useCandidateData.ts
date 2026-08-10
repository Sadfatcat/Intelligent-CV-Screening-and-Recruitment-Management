"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_JOB_DESCRIPTIONS } from "@/mock/cvScreeningMockData";
import { MOCK_JOB_CARDS } from "@/mock/mockJobCards";
import { apiUrl } from "@/utils/api";
import { getStoredUser } from "@/utils/authSession";
import { ENABLE_DEV_MOCK_DATA, FINT_MOCK_APPLICATIONS_STORAGE_KEY } from "@/features/recruiter/constants/recruiterConstants";

export type JobItem = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity?: number | null;
    salary?: string | null;
    direct_contact?: string | null;
    image_url?: string;
    description: string;
    requirements?: string;
    jd_parsed_text?: string | null;
    jd_file_path?: string | null;
    isMock?: boolean;
    mockDisplayOnly?: boolean;
};

export type MatchingSection = {
    key: string;
    label: string;
    score?: number | null;
    good?: string[];
    missing?: string[];
    explanation?: string | null;
};

export type MatchingDetail = {
    overall_score?: number | null;
    final_score?: number | null;
    finalScore?: number | null;
    subScores?: Record<string, number | null> | null;
    matched?: Record<string, string[] | undefined> | null;
    missingOrWeak?: Record<string, string[] | undefined> | null;
    reasoningSummary?: string | null;
    scoringEngine?: string | null;
    sections?: MatchingSection[];
    good_points?: string[];
    missing_points?: string[];
    must_have?: {
        matched?: string[];
        missing?: string[];
        penalty_applied?: number | null;
    };
};

export type CandidateSubmissionItem = {
    application_id: number;
    job_id: number;
    job_title: string;
    company_name: string;
    location: string;
    level: string;
    deadline?: string | null;
    quantity?: number | null;
    salary?: string | null;
    direct_contact?: string | null;
    image_url?: string | null;
    description?: string | null;
    status: string;
    ai_matching_score: number | null;
    matching_detail?: MatchingDetail | null;
    submitted_at: string | null;
};

export type StoredFintMockApplication = {
    id: number;
    jobId: number;
    jobTitle: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    cvFileName: string;
    submittedAt: string;
    targetPosition: string;
    additionalInfo: string;
};

const MOCK_CANDIDATE_JOBS: JobItem[] = MOCK_JOB_DESCRIPTIONS.map((job) => ({
    id: job.id,
    title: job.title,
    company_name: job.company,
    location: job.location,
    level: job.level,
    deadline: job.createdAt.slice(0, 10),
    quantity: 3,
    salary: "Negotiable",
    direct_contact: "fintvn@fint.vn",
    description: `${job.department} | ${job.employmentType}. ${job.responsibilities.join(" ")}`,
    requirements: [
        `Required: ${job.requiredSkills.join(", ")}`,
        job.preferredSkills.length ? `Preferred: ${job.preferredSkills.join(", ")}` : "Preferred: none",
        `Experience: ${job.requiredExperienceYears}+ years`,
        `Education: ${job.educationRequirement}`,
        `Languages: ${job.languageRequirements.join(", ")}`,
    ].join(" | "),
    jd_file_path: null,
    isMock: true,
}));

const SHOW_CANDIDATE_DEMO_JOB_CARDS = process.env.NODE_ENV !== "production" || ENABLE_DEV_MOCK_DATA;

export function saveFintMockApplication(application: StoredFintMockApplication) {
    if (!ENABLE_DEV_MOCK_DATA) return;
    try {
        const raw = localStorage.getItem(FINT_MOCK_APPLICATIONS_STORAGE_KEY);
        const current = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(current) ? current : [];
        localStorage.setItem(FINT_MOCK_APPLICATIONS_STORAGE_KEY, JSON.stringify([application, ...list]));
    } catch {
        localStorage.setItem(FINT_MOCK_APPLICATIONS_STORAGE_KEY, JSON.stringify([application]));
    }
}

async function parseApiResponse(response: Response): Promise<{ data: unknown; message: string }> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        const data = await response.json();
        const message =
            typeof data === "object" && data !== null && "detail" in data
                ? String((data as { detail?: unknown }).detail ?? "")
                : "";
        return { data, message };
    }
    const text = await response.text();
    return { data: null, message: text || "Unexpected server response" };
}

export function useCandidateData() {
    const [candidateId, setCandidateId] = useState<number | null>(null);
    const [displayName, setDisplayName] = useState("Candidate");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [submittedJobs, setSubmittedJobs] = useState<CandidateSubmissionItem[]>([]);
    const [isCvScoring, setIsCvScoring] = useState(false);
    const [applyStatus, setApplyStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const scoringApplicationIdsRef = useRef<Set<number>>(new Set());
    const submittedJobsLoadedRef = useRef(false);

    const hasScoringApplication = submittedJobs.some((item) => item.status === "scoring");

    const loadSubmittedJobs = useCallback(async (candidateIdValue: number) => {
        const response = await fetch(apiUrl(`/api/cvs/candidate/${candidateIdValue}/applications`));
        const { data, message } = await parseApiResponse(response);
        if (!response.ok) throw new Error(message || "Failed to load submitted jobs");

        const applications =
            typeof data === "object" &&
            data !== null &&
            "applications" in data &&
            Array.isArray((data as { applications?: unknown }).applications)
                ? ((data as { applications: CandidateSubmissionItem[] }).applications)
                : [];

        const nextScoringIds = new Set(
            applications.filter((item) => item.status === "scoring").map((item) => item.application_id)
        );
        const completedScoring = applications.filter(
            (item) => item.status !== "scoring" && scoringApplicationIdsRef.current.has(item.application_id)
        );

        if (submittedJobsLoadedRef.current && completedScoring.length > 0) {
            const hasScore = completedScoring.some(
                (item) => typeof item.ai_matching_score === "number" && !Number.isNaN(item.ai_matching_score)
            );
            setApplyStatus({
                type: "success",
                message: hasScore
                    ? "Scoring completed. Your CV matching result is ready."
                    : "Scoring completed, but no matching score was returned.",
            });
        }

        scoringApplicationIdsRef.current = nextScoringIds;
        submittedJobsLoadedRef.current = true;
        setSubmittedJobs(applications);
        setIsCvScoring(applications.some((item) => item.status === "scoring"));
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const sessionUser = getStoredUser("candidate");
            if (sessionUser) {
                setCandidateId(sessionUser.user_id);
                const email = sessionUser.email || "";
                const fallbackName = email.includes("@") ? email.split("@")[0] : "Candidate";
                setDisplayName(sessionUser.full_name?.trim() || fallbackName);
                setCandidateEmail(email);
                return;
            }
            setCandidateId(null);
            setDisplayName("Candidate");
            setCandidateEmail("");
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (candidateId === null) {
            const timer = window.setTimeout(() => {
                setSubmittedJobs([]);
                setIsCvScoring(false);
                scoringApplicationIdsRef.current = new Set();
                submittedJobsLoadedRef.current = false;
            }, 0);
            return () => window.clearTimeout(timer);
        }
        const timer = window.setTimeout(() => {
            loadSubmittedJobs(candidateId).catch(() => {
                setSubmittedJobs([]);
                setIsCvScoring(false);
            });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [candidateId, loadSubmittedJobs]);

    useEffect(() => {
        if (candidateId === null || (!isCvScoring && !hasScoringApplication)) return;
        const timer = window.setInterval(() => {
            loadSubmittedJobs(candidateId).catch(() => {});
        }, 2500);
        return () => window.clearInterval(timer);
    }, [candidateId, hasScoringApplication, isCvScoring, loadSubmittedJobs]);

    useEffect(() => {
        fetch(apiUrl("/api/jobs/"))
            .then(async (response) => {
                const { data, message } = await parseApiResponse(response);
                if (!response.ok) throw new Error(message || "Failed to load jobs");
                const normalizedJobs: JobItem[] = Array.isArray(data)
                    ? (data as JobItem[]).map((job) => ({ ...job, image_url: job.image_url ?? undefined }))
                    : [];
                setJobs(
                    SHOW_CANDIDATE_DEMO_JOB_CARDS
                        ? [...normalizedJobs, ...MOCK_CANDIDATE_JOBS, ...MOCK_JOB_CARDS]
                        : normalizedJobs
                );
            })
            .catch(() => setJobs([]));
    }, []);

    return {
        candidateId,
        displayName,
        candidateEmail,
        setCandidateEmail,
        jobs,
        submittedJobs,
        setSubmittedJobs,
        isCvScoring,
        setIsCvScoring,
        hasScoringApplication,
        applyStatus,
        setApplyStatus,
        loadSubmittedJobs,
        parseApiResponse,
        saveFintMockApplication,
    };
}
