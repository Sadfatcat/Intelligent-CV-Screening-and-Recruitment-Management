// Recruiter Constants: key lưu localStorage và nhãn trạng thái dùng chung.
import type { JobManagementStatus, ScoreStatus } from "../types/recruiterTypes";

export const JOB_MANAGEMENT_STORAGE_KEY = "recruiterJobManagementState";
export const FPT_MOCK_APPLICATIONS_STORAGE_KEY = "fptMockSubmittedCvLogs";
export const RECRUITER_SESSION_STORAGE_KEY = "recruiterUser";
export const RECRUITER_PASSWORD_CHANGE_STORAGE_KEY = "recruiterPasswordChangeUser";

export const SCORE_STATUS_LABELS: Record<ScoreStatus, string> = {
    passed: "Passed",
    borderline: "Borderline",
    failed: "Failed",
    not_scored: "Not scored",
};

export const JOB_MANAGEMENT_LABELS: Record<JobManagementStatus, string> = {
    active: "Active",
    turned_off: "Turned Off",
    deleted: "Deleted",
};
