"use client";

import { useEffect, useState } from "react";
import { RECRUITER_SESSION_STORAGE_KEY } from "../constants/recruiterConstants";
import {
    fetchRecruiterCvLogs,
    fetchRecruiterJobs,
    fetchRecruiterProfile,
} from "../services/recruiterApi";
import type { CVLogItem, RecruiterJob, RecruiterSession } from "../types/recruiterTypes";
import { readStoredFptMockCvLogs } from "../utils/recruiterMockMappers";

export function useRecruiterData() {
    const [session, setSession] = useState<RecruiterSession | null>(null);
    const [isSessionChecked, setIsSessionChecked] = useState(false);
    const [jobs, setJobs] = useState<RecruiterJob[]>([]);
    const [cvLogs, setCvLogs] = useState<CVLogItem[]>([]);
    const [companyName, setCompanyName] = useState("");
    const [isScreeningLoading, setIsScreeningLoading] = useState(false);
    const [screeningError, setScreeningError] = useState("");
    const [storedFptCvLogs, setStoredFptCvLogs] = useState<CVLogItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(RECRUITER_SESSION_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as RecruiterSession;
                if (parsed.role === "recruiter" && !parsed.must_change_password) {
                    window.setTimeout(() => setSession(parsed), 0);
                }
            } catch {
                localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
            }
        }
        window.setTimeout(() => setIsSessionChecked(true), 0);
    }, []);

    useEffect(() => {
        function sync() {
            setStoredFptCvLogs(readStoredFptMockCvLogs());
        }
        sync();
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, []);

    async function loadJobs(recruiterId: number) {
        const data = await fetchRecruiterJobs(recruiterId);
        setJobs(data);
    }

    async function loadCvLogs(recruiterId: number) {
        setIsScreeningLoading(true);
        setScreeningError("");
        try {
            const data = await fetchRecruiterCvLogs(recruiterId);
            setCvLogs(data);
        } catch (err) {
            setCvLogs([]);
            setScreeningError(err instanceof Error ? err.message : "Failed to load CV logs");
        } finally {
            setIsScreeningLoading(false);
        }
    }

    useEffect(() => {
        if (!session) return;

        fetchRecruiterProfile(session.user_id)
            .then((data) => {
                const accountCompany = typeof data.company_name === "string" ? data.company_name : "";
                setCompanyName(accountCompany);
                const mergedSession: RecruiterSession = {
                    ...session,
                    email: data.email || session.email,
                    company_name: accountCompany || session.company_name,
                };
                const hasChanged =
                    mergedSession.email !== session.email ||
                    mergedSession.company_name !== session.company_name;
                if (hasChanged) {
                    setSession(mergedSession);
                    localStorage.setItem(RECRUITER_SESSION_STORAGE_KEY, JSON.stringify(mergedSession));
                }
            })
            .catch(() => {
                setCompanyName(session.company_name || "");
            });

        const timer = window.setTimeout(() => {
            loadJobs(session.user_id).catch(() => {});
            loadCvLogs(session.user_id).catch(() => {});
        }, 0);

        return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user_id]);

    return {
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
        storedFptCvLogs,
    };
}
