"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/utils/authSession";
import { ENABLE_DEV_MOCK_DATA } from "../constants/recruiterConstants";
import {
    fetchRecruiterCvLogs,
    fetchRecruiterJobs,
    fetchRecruiterProfile,
} from "../services/recruiterApi";
import type { CVLogItem, RecruiterJob, RecruiterSession } from "../types/recruiterTypes";
import { readStoredFintMockCvLogs } from "../utils/recruiterMockMappers";

export function useRecruiterData() {
    const [session, setSession] = useState<RecruiterSession | null>(null);
    const [isSessionChecked, setIsSessionChecked] = useState(false);
    const [jobs, setJobs] = useState<RecruiterJob[]>([]);
    const [cvLogs, setCvLogs] = useState<CVLogItem[]>([]);
    const [companyName, setCompanyName] = useState("");
    const [isScreeningLoading, setIsScreeningLoading] = useState(false);
    const [screeningError, setScreeningError] = useState("");
    const [storedFintCvLogs, setStoredFintCvLogs] = useState<CVLogItem[]>([]);

    useEffect(() => {
        const sessionUser = getStoredUser("recruiter") as RecruiterSession | null;
        if (sessionUser && !sessionUser.must_change_password) {
            window.setTimeout(() => setSession(sessionUser), 0);
            window.setTimeout(() => setIsSessionChecked(true), 0);
            return;
        }
        window.setTimeout(() => setIsSessionChecked(true), 0);
    }, []);

    useEffect(() => {
        if (!ENABLE_DEV_MOCK_DATA) return;
        function sync() {
            setStoredFintCvLogs(readStoredFintMockCvLogs());
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
                    full_name: data.full_name ?? session.full_name,
                    phone: data.phone ?? session.phone,
                    company_name: accountCompany || session.company_name,
                };
                const hasChanged =
                    mergedSession.email !== session.email ||
                    mergedSession.full_name !== session.full_name ||
                    mergedSession.phone !== session.phone ||
                    mergedSession.company_name !== session.company_name;
                if (hasChanged) {
                    setSession(mergedSession);
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
        storedFintCvLogs,
    };
}
