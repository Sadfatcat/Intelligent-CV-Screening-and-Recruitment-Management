// Recruiter API: gom các API call của recruiter để UI không gọi fetch trực tiếp.
import { apiUrl } from "@/utils/api";
import type { CVLogItem, JobApplication, RecruiterJob, RecruiterSession, UploadJobDescriptionPayload } from "../types/recruiterTypes";

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : { detail: await response.text() };
    if (!response.ok) {
        throw new Error(data.detail || fallbackMessage);
    }
    return data as T;
}

export async function loginRecruiter(email: string, password: string): Promise<RecruiterSession> {
    const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse<RecruiterSession>(response, "Login failed");
    if (data.role !== "recruiter") {
        throw new Error("This account is not recruiter");
    }
    return {
        user_id: data.user_id,
        role: data.role,
        email: data.email || email,
        company_name: data.company_name,
        must_change_password: data.must_change_password,
    };
}

export async function changeRecruiterPassword(userId: number, currentPassword: string, newPassword: string) {
    const response = await fetch(apiUrl("/api/auth/change-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: userId,
            current_password: currentPassword,
            new_password: newPassword,
        }),
    });
    return parseJsonResponse<{ message: string }>(response, "Change password failed");
}

export async function fetchRecruiterProfile(recruiterId: number) {
    const response = await fetch(apiUrl(`/api/recruiter/${recruiterId}/profile`));
    return parseJsonResponse<{ email?: string; company_name?: string }>(response, "Failed to load recruiter profile");
}

export async function fetchRecruiterJobs(recruiterId: number): Promise<RecruiterJob[]> {
    const response = await fetch(apiUrl(`/api/recruiter/${recruiterId}/jobs`));
    const data = await parseJsonResponse<unknown>(response, "Failed to load recruiter jobs");
    return Array.isArray(data) ? data as RecruiterJob[] : [];
}

export async function fetchRecruiterCvLogs(recruiterId: number): Promise<CVLogItem[]> {
    const response = await fetch(apiUrl(`/api/recruiter/${recruiterId}/cv-logs`));
    const data = await parseJsonResponse<unknown>(response, "Failed to load CV logs");
    return Array.isArray(data) ? data as CVLogItem[] : [];
}

export async function fetchJobApplications(recruiterId: number, jobId: number): Promise<JobApplication[]> {
    const response = await fetch(apiUrl(`/api/recruiter/${recruiterId}/jobs/${jobId}/applications`));
    const data = await parseJsonResponse<{ applications?: unknown }>(response, "Failed to load applications");
    return Array.isArray(data.applications) ? data.applications as JobApplication[] : [];
}

export async function uploadJobDescription(payload: UploadJobDescriptionPayload) {
    const formData = new FormData();
    formData.append("recruiter_id", String(payload.recruiterId));
    formData.append("title", payload.title);
    formData.append("location", payload.location);
    formData.append("level", payload.level);
    formData.append("deadline", payload.deadline);
    formData.append("quantity", String(payload.quantity));
    formData.append("salary", payload.salary);
    formData.append("direct_contact", payload.directContact);
    formData.append("description", payload.description);
    formData.append("jd_file", payload.jdFile);
    if (payload.coverImageFile) {
        formData.append("cover_image", payload.coverImageFile);
    }

    const response = await fetch(apiUrl("/api/jobs/upload-jd"), {
        method: "POST",
        body: formData,
    });
    return parseJsonResponse<unknown>(response, "Upload JD failed");
}

export async function deleteApplication(recruiterId: number, applicationId: number) {
    const response = await fetch(apiUrl(`/api/recruiter/${recruiterId}/applications/${applicationId}`), {
        method: "DELETE",
    });
    return parseJsonResponse<unknown>(response, "Delete CV failed");
}

export function getRecruiterCvFileUrl(recruiterId: number, applicationId: number, inline = false) {
    const suffix = inline ? "?inline=true" : "";
    return apiUrl(`/api/recruiter/${recruiterId}/applications/${applicationId}/cv-file${suffix}`);
}
