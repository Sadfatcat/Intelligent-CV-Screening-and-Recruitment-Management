// Recruiter Types: gom các kiểu dữ liệu chính của recruiter UI.
export type RecruiterSession = {
    user_id: number;
    role: string;
    email?: string;
    full_name?: string | null;
    phone?: string | null;
    company_name?: string;
    must_change_password?: boolean;
};

export type RecruiterJob = {
    id: number;
    title: string;
    company_name: string;
    location: string;
    level: string;
    deadline: string;
    quantity?: number | null;
    salary?: string | null;
    direct_contact?: string | null;
    image_url?: string | null;
    status?: JobManagementStatus;
    isMock?: boolean;
};

export type MatchingSection = {
    key: string;
    label: string;
    score?: number | null;
    weight?: number | null;
    good?: string[];
    missing?: string[];
    explanation?: string | null;
};

export type MatchingDetail = {
    overall_score?: number | null;
    final_score?: number | null;
    summary?: {
        good_count?: number;
        missing_count?: number;
        must_have_matched_count?: number;
        must_have_missing_count?: number;
    };
    sections?: MatchingSection[];
    good_points?: string[];
    missing_points?: string[];
    must_have?: {
        matched?: string[];
        missing?: string[];
        penalty_applied?: number | null;
    };
};

export type JobApplication = {
    application_id: number;
    cv_id: number | null;
    candidate_name: string | null;
    candidate_email: string | null;
    candidate_phone: string | null;
    status: string;
    ai_matching_score: number | null;
    matching_detail?: MatchingDetail | null;
};

export type JobApplicationsResponse = {
    applications: JobApplication[];
};

export type CVLogItem = {
    log_id: number;
    created_at: string;
    job_id: number;
    job_title: string;
    application_id: number;
    cv_id: number | null;
    candidate_name: string | null;
    candidate_email: string | null;
    candidate_phone: string | null;
    status: string;
    ai_matching_score: number | null;
    matching_detail?: MatchingDetail | null;
    isMock?: boolean;
    cv_file_name?: string | null;
    target_position?: string | null;
    skills?: string[];
    extra_skills?: string[];
    experience_years?: number | null;
    education?: string | null;
    languages?: string[];
    projects?: string[];
    certifications?: string[];
    work_experience?: string[];
    summary?: string | null;
};

export type ScoreStatus = "passed" | "borderline" | "failed" | "not_scored";
export type ScoringSubTab = "jobs" | "cvs" | "detail";
export type CvSortMode = "score" | "experience";
export type ExperienceFilter = "all" | "intern" | "gt1" | "gt3" | "gt5" | "gt7";
export type JobManagementStatus = "draft" | "active" | "turned_off" | "closed" | "deleted";

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

export type ScreeningSummary = {
    total: number;
    scored: number;
    passed: number;
    borderline: number;
    failed: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
};

export type UploadJobDescriptionPayload = {
    recruiterId: number;
    title: string;
    location: string;
    level: string;
    deadline: string;
    quantity: number;
    salary: string;
    directContact: string;
    description: string;
    jdFile: File;
    coverImageFile?: File | null;
};
