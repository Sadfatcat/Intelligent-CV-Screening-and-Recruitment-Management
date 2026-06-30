// Mock Mapping: chuyển mock Fint data về cùng format với dữ liệu thật.
import { MOCK_CANDIDATES, MOCK_JOB_DESCRIPTIONS, MOCK_MATCHING_RESULTS } from "@/mock/cvScreeningMockData";
import { ENABLE_DEV_MOCK_DATA, FINT_MOCK_APPLICATIONS_STORAGE_KEY } from "../constants/recruiterConstants";
import type { CVLogItem, MatchingDetail, RecruiterJob, RecruiterSession, StoredFintMockApplication } from "../types/recruiterTypes";

export const MOCK_RECRUITER_JOBS: RecruiterJob[] = MOCK_JOB_DESCRIPTIONS.map((job) => ({
    id: job.id,
    title: job.title,
    company_name: job.company,
    location: job.location,
    level: job.level,
    deadline: job.createdAt.slice(0, 10),
    quantity: 3,
    salary: "Negotiable",
    direct_contact: "fintvn@fint.vn",
    image_url: null,
    isMock: true,
}));

export const MOCK_FINT_CV_LOGS: CVLogItem[] = MOCK_MATCHING_RESULTS.map((result) => {
    const candidate = MOCK_CANDIDATES.find((item) => item.id === result.cvId);
    const breakdown = result.scoreBreakdown || {};
    const matchingDetail: MatchingDetail = {
        overall_score: result.overallScore ?? null,
        final_score: result.overallScore ?? null,
        summary: {
            good_count: result.matchedSkills.length + result.matchedExperience.length + result.relevantProjects.length,
            missing_count: result.missingSkills.length + result.missingRequirements.length,
            must_have_matched_count: result.matchedSkills.length,
            must_have_missing_count: result.missingSkills.length,
        },
        sections: [
            {
                key: "technical_skills",
                label: "Technical Skills",
                score: breakdown.skillsScore ?? null,
                weight: 0.25,
                good: result.matchedSkills.map((skill) => `${skill} matched`),
                missing: result.missingSkills.map((skill) => `${skill} missing`),
                explanation: result.reason,
            },
            {
                key: "experience",
                label: "Experience",
                score: breakdown.experienceScore ?? null,
                weight: 0.25,
                good: result.matchedExperience,
                missing: result.missingRequirements,
                explanation: result.matchedExperience.length
                    ? result.matchedExperience.join("; ")
                    : "No matching experience evidence recorded.",
            },
            {
                key: "education",
                label: "Education",
                score: breakdown.educationScore ?? null,
                weight: 0.05,
                good: result.educationMatch && result.educationMatch !== "Pending" ? [result.educationMatch] : [],
                missing: result.educationMatch === "Pending" ? ["Education match pending"] : [],
                explanation: result.educationMatch,
            },
            {
                key: "natural_languages",
                label: "Languages",
                score: breakdown.languageScore ?? null,
                weight: 0.04,
                good: result.languageMatch && result.languageMatch !== "Pending" ? [result.languageMatch] : [],
                missing: result.languageMatch === "Pending" ? ["Language match pending"] : [],
                explanation: result.languageMatch,
            },
            {
                key: "projects",
                label: "Projects",
                score: breakdown.projectScore ?? null,
                weight: 0.1,
                good: result.relevantProjects,
                missing: result.relevantProjects.length ? [] : ["No relevant project found"],
                explanation: result.relevantProjects.length
                    ? result.relevantProjects.join("; ")
                    : "No relevant project evidence recorded.",
            },
            {
                key: "responsibilities",
                label: "JD Requirements",
                score: breakdown.keywordScore ?? null,
                weight: 0.1,
                good: result.matchedSkills.map((skill) => `${skill} supports JD keyword match`),
                missing: result.missingRequirements,
                explanation: result.reason,
            },
        ],
        good_points: [
            ...result.matchedSkills.map((skill) => `${skill} matched`),
            ...result.matchedExperience,
            ...result.relevantProjects,
        ],
        missing_points: [
            ...result.missingSkills.map((skill) => `${skill} missing`),
            ...result.missingRequirements,
            ...result.risks,
        ],
        must_have: {
            matched: result.matchedSkills,
            missing: result.missingSkills,
            penalty_applied: result.missingSkills.length ? Math.min(20, result.missingSkills.length * 4) : 0,
        },
    };

    return {
        log_id: 900000 + result.id,
        created_at: result.scoredAt || candidate?.uploadedAt || "2026-04-26T00:00:00Z",
        job_id: result.jdId,
        job_title: result.jdTitle,
        application_id: 800000 + result.id,
        cv_id: result.cvId,
        candidate_name: result.candidateName ?? candidate?.candidateName ?? null,
        candidate_email: candidate?.email ?? null,
        candidate_phone: candidate?.phone ?? null,
        status: result.status.toLowerCase(),
        ai_matching_score: result.overallScore ?? null,
        matching_detail: matchingDetail,
        isMock: true,
        cv_file_name: candidate?.cvFileName ?? null,
        target_position: candidate?.targetPosition ?? result.jdTitle,
        skills: candidate?.skills ?? [],
        extra_skills: result.extraSkills,
        experience_years: candidate?.experienceYears ?? null,
        education: candidate?.education ?? null,
        languages: candidate?.languages ?? [],
        projects: candidate?.projects ?? [],
        certifications: candidate?.certifications ?? [],
        work_experience: candidate?.workExperience ?? [],
        summary: candidate?.summary ?? null,
    };
});

export function readStoredFintMockCvLogs(): CVLogItem[] {
    if (!ENABLE_DEV_MOCK_DATA) return [];
    try {
        const raw = localStorage.getItem(FINT_MOCK_APPLICATIONS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as StoredFintMockApplication[];
        if (!Array.isArray(parsed)) return [];
        return parsed.map((item) => ({
            log_id: 990000 + item.id,
            created_at: item.submittedAt,
            job_id: item.jobId,
            job_title: item.jobTitle,
            application_id: item.id,
            cv_id: null,
            candidate_name: item.candidateName || null,
            candidate_email: item.candidateEmail || null,
            candidate_phone: item.candidatePhone || null,
            status: "mock-submitted",
            ai_matching_score: null,
            matching_detail: null,
            isMock: true,
            cv_file_name: item.cvFileName,
            target_position: item.targetPosition || item.jobTitle,
            skills: [],
            extra_skills: [],
            experience_years: null,
            education: null,
            languages: [],
            projects: [],
            certifications: [],
            work_experience: [],
            summary: item.additionalInfo || "Candidate submitted this CV from the mock Fint Vietnam job listing.",
        }));
    } catch {
        return [];
    }
}

export function isFintSession(session: RecruiterSession | null, companyName: string) {
    if (!ENABLE_DEV_MOCK_DATA) return false;
    const text = `${session?.company_name || ""} ${session?.email || ""} ${companyName}`.toLowerCase();
    return text.includes("fint") || text.includes("fintvn@fint.vn");
}
