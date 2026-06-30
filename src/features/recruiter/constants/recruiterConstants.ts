// Recruiter Constants: key lưu localStorage và nhãn trạng thái dùng chung.
import type { JobManagementStatus, ScoreStatus } from "../types/recruiterTypes";

export const FINT_MOCK_APPLICATIONS_STORAGE_KEY = "fintMockSubmittedCvLogs";
export const RECRUITER_SESSION_STORAGE_KEY = "recruiterUser";
export const RECRUITER_PASSWORD_CHANGE_STORAGE_KEY = "recruiterPasswordChangeUser";
export const ENABLE_DEV_MOCK_DATA = process.env.NEXT_PUBLIC_ENABLE_DEV_MOCK_DATA === "1";

export const SCORE_STATUS_LABELS: Record<ScoreStatus, string> = {
    passed: "Strong match",
    borderline: "Potential match",
    failed: "Not suitable",
    not_scored: "Not scored",
};

export const JOB_MANAGEMENT_LABELS: Record<JobManagementStatus, string> = {
    draft: "Draft",
    active: "Active",
    turned_off: "Turned Off",
    closed: "Closed",
    deleted: "Deleted",
};
