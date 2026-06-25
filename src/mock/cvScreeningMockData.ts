export type MockJobLevel = "Intern" | "Fresher" | "Junior" | "Middle" | "Senior";
export type MockJobStatus = "Open" | "Paused" | "Closed";
export type MockCandidateStatus = "New" | "Screened" | "Interviewing" | "Rejected" | "Hired";
export type MockMatchingStatus = "Passed" | "Borderline" | "Failed" | "Pending";
export type MockRecommendation = "Recommend interview" | "Review manually" | "Reject" | "Pending scoring";

export type MockJobDescription = {
    id: number;
    title: string;
    company: string;
    department: string;
    level: MockJobLevel;
    location: string;
    employmentType: string;
    requiredSkills: string[];
    preferredSkills: string[];
    requiredExperienceYears: number;
    educationRequirement: string;
    languageRequirements: string[];
    responsibilities: string[];
    requirements: string[];
    niceToHave: string[];
    keywords: string[];
    createdAt: string;
    status: MockJobStatus;
};

export type MockCandidateProfile = {
    id: number;
    candidateName?: string | null;
    email?: string | null;
    phone?: string | null;
    cvFileName: string;
    targetPosition: string;
    skills: string[];
    experienceYears: number;
    education: string;
    languages: string[];
    projects: string[];
    certifications: string[];
    workExperience: string[];
    summary: string;
    uploadedAt: string;
    status: MockCandidateStatus;
};

export type MockMatchingResult = {
    id: number;
    jdId: number;
    cvId: number;
    candidateName?: string | null;
    jdTitle: string;
    overallScore?: number | null;
    status: MockMatchingStatus;
    recommendation: MockRecommendation;
    scoreBreakdown: {
        skillsScore?: number | null;
        experienceScore?: number | null;
        educationScore?: number | null;
        languageScore?: number | null;
        projectScore?: number | null;
        keywordScore?: number | null;
    };
    matchedSkills: string[];
    missingSkills: string[];
    extraSkills: string[];
    matchedExperience: string[];
    missingRequirements: string[];
    educationMatch: string;
    languageMatch: string;
    relevantProjects: string[];
    reason: string;
    risks: string[];
    scoredAt?: string | null;
};

export const MOCK_JOB_DESCRIPTIONS: MockJobDescription[] = [
    {
        id: 501,
        title: "Backend Engineer - Fintech Platform",
        company: "Fint Vietnam",
        department: "Core Banking Platform",
        level: "Middle",
        location: "Ho Chi Minh City",
        employmentType: "Full-time",
        requiredSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
        preferredSkills: ["Redis", "Kubernetes", "AWS", "CI/CD"],
        requiredExperienceYears: 3,
        educationRequirement: "Bachelor in Computer Science, Software Engineering, or equivalent backend experience",
        languageRequirements: ["Vietnamese", "English"],
        responsibilities: [
            "Design and maintain secure REST APIs for wallet, payment, and loan services",
            "Optimize PostgreSQL queries and database schema for transaction-heavy systems",
            "Containerize services with Docker and collaborate on CI/CD release pipelines",
            "Write clear technical documentation and communicate risks with product stakeholders",
        ],
        requirements: [
            "3+ years backend engineering experience",
            "Strong Python and FastAPI production experience",
            "PostgreSQL schema design and query optimization",
            "Docker-based deployment workflow",
            "Can communicate technical tradeoffs in Vietnamese and English",
        ],
        niceToHave: [
            "Redis caching",
            "Kubernetes deployment",
            "AWS cloud services",
            "Financial transaction or compliance domain experience",
        ],
        keywords: ["backend", "fintech", "python", "fastapi", "postgresql", "docker", "rest api"],
        createdAt: "2026-06-20T08:00:00Z",
        status: "Open",
    },
];

export const MOCK_CANDIDATES: MockCandidateProfile[] = [
    {
        id: 701,
        candidateName: "Nguyen Minh Anh",
        email: "minh.anh.backend@example.com",
        phone: "0901234567",
        cvFileName: "nguyen_minh_anh_backend.pdf",
        targetPosition: "Backend Engineer - Fintech Platform",
        skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API", "Redis", "CI/CD", "Git"],
        experienceYears: 4,
        education: "Bachelor in Software Engineering",
        languages: ["Vietnamese", "English"],
        projects: [
            "Built payment reconciliation APIs with FastAPI and PostgreSQL for 2 million monthly transactions",
            "Added Redis caching and Docker-based deployment for internal fintech services",
        ],
        certifications: ["AWS Cloud Practitioner"],
        workExperience: [
            "4 years backend engineering experience in payment and lending platforms",
            "Owned API design, SQL optimization, and release documentation for production systems",
        ],
        summary: "Backend engineer with fintech API ownership, strong Python/FastAPI, PostgreSQL, Docker, Redis, and bilingual communication.",
        uploadedAt: "2026-06-20T09:10:00Z",
        status: "Screened",
    },
    {
        id: 702,
        candidateName: "Tran Hoang Bao",
        email: "hoang.bao.backend@example.com",
        phone: "0912345678",
        cvFileName: "tran_hoang_bao_backend.pdf",
        targetPosition: "Backend Engineer - Fintech Platform",
        skills: ["Python", "Django", "PostgreSQL", "Docker", "REST API", "Git"],
        experienceYears: 3,
        education: "Bachelor in Information Technology",
        languages: ["Vietnamese", "English"],
        projects: [
            "Developed REST APIs for merchant onboarding and internal reporting dashboards",
            "Maintained PostgreSQL tables and Docker images for staging environments",
        ],
        certifications: ["Scrum Fundamentals"],
        workExperience: [
            "3 years backend experience across e-commerce and internal banking support tools",
            "Worked with SQL query tuning and API documentation, but limited FastAPI exposure",
        ],
        summary: "Backend developer with solid Python, PostgreSQL, Docker, REST API experience; close fit but missing direct FastAPI depth and cloud exposure.",
        uploadedAt: "2026-06-20T09:20:00Z",
        status: "Screened",
    },
    {
        id: 703,
        candidateName: "Le Thu Trang",
        email: "thu.trang.fullstack@example.com",
        phone: "0923456789",
        cvFileName: "le_thu_trang_fullstack.pdf",
        targetPosition: "Backend Engineer - Fintech Platform",
        skills: ["JavaScript", "React", "Node.js", "MongoDB", "REST API", "Docker"],
        experienceYears: 2,
        education: "Bachelor in Computer Science",
        languages: ["Vietnamese"],
        projects: [
            "Created customer portals with React and Node.js APIs for a retail SaaS product",
            "Used Docker for local development but did not own production database optimization",
        ],
        certifications: ["Frontend Developer Certificate"],
        workExperience: [
            "2 years full-stack product development experience",
            "Focused mostly on frontend delivery and Node.js CRUD APIs",
        ],
        summary: "Full-stack developer with useful API experience but missing Python, FastAPI, PostgreSQL depth, English requirement, and required experience years.",
        uploadedAt: "2026-06-20T09:30:00Z",
        status: "Screened",
    },
];

export const MOCK_MATCHING_RESULTS: MockMatchingResult[] = [
    {
        id: 801,
        jdId: 501,
        cvId: 701,
        candidateName: "Nguyen Minh Anh",
        jdTitle: "Backend Engineer - Fintech Platform",
        overallScore: 92.4,
        status: "Passed",
        recommendation: "Recommend interview",
        scoreBreakdown: {
            skillsScore: 96,
            experienceScore: 95,
            educationScore: 90,
            languageScore: 100,
            projectScore: 92,
            keywordScore: 94,
        },
        matchedSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API", "Redis", "CI/CD"],
        missingSkills: ["Kubernetes"],
        extraSkills: ["Git", "AWS Cloud Practitioner"],
        matchedExperience: ["4 years backend engineering experience", "Fintech payment API ownership"],
        missingRequirements: ["Kubernetes deployment is not shown as hands-on experience"],
        educationMatch: "Bachelor in Software Engineering matches the requirement",
        languageMatch: "Vietnamese and English matched",
        relevantProjects: [
            "Payment reconciliation APIs with FastAPI and PostgreSQL",
            "Redis caching and Docker deployment for fintech services",
        ],
        reason: "Strong match across must-have backend stack, experience, fintech projects, education, and languages.",
        risks: ["Kubernetes is only a nice-to-have gap"],
        scoredAt: "2026-06-20T09:40:00Z",
    },
    {
        id: 802,
        jdId: 501,
        cvId: 702,
        candidateName: "Tran Hoang Bao",
        jdTitle: "Backend Engineer - Fintech Platform",
        overallScore: 73.6,
        status: "Borderline",
        recommendation: "Review manually",
        scoreBreakdown: {
            skillsScore: 74,
            experienceScore: 80,
            educationScore: 88,
            languageScore: 100,
            projectScore: 68,
            keywordScore: 72,
        },
        matchedSkills: ["Python", "PostgreSQL", "Docker", "REST API"],
        missingSkills: ["FastAPI", "Redis", "Kubernetes", "AWS"],
        extraSkills: ["Django", "Git", "Scrum Fundamentals"],
        matchedExperience: ["3 years backend experience", "SQL query tuning and API documentation"],
        missingRequirements: ["No direct FastAPI production ownership", "Cloud deployment experience not demonstrated"],
        educationMatch: "Bachelor in Information Technology is acceptable",
        languageMatch: "Vietnamese and English matched",
        relevantProjects: [
            "Merchant onboarding REST APIs",
            "PostgreSQL table maintenance and Docker images for staging",
        ],
        reason: "Good backend foundation and required experience, but must be reviewed because FastAPI and cloud evidence are weak.",
        risks: ["Framework mismatch: Django instead of FastAPI", "Limited fintech/compliance context"],
        scoredAt: "2026-06-20T09:45:00Z",
    },
    {
        id: 803,
        jdId: 501,
        cvId: 703,
        candidateName: "Le Thu Trang",
        jdTitle: "Backend Engineer - Fintech Platform",
        overallScore: 38.2,
        status: "Failed",
        recommendation: "Reject",
        scoreBreakdown: {
            skillsScore: 32,
            experienceScore: 40,
            educationScore: 85,
            languageScore: 55,
            projectScore: 45,
            keywordScore: 35,
        },
        matchedSkills: ["Docker", "REST API"],
        missingSkills: ["Python", "FastAPI", "PostgreSQL", "Redis", "English"],
        extraSkills: ["React", "JavaScript", "Node.js", "MongoDB"],
        matchedExperience: ["2 years full-stack product development"],
        missingRequirements: ["3+ years backend engineering experience required", "No Python/FastAPI/PostgreSQL production evidence", "English requirement missing"],
        educationMatch: "Bachelor in Computer Science matches the education requirement",
        languageMatch: "Vietnamese matched; English missing",
        relevantProjects: [
            "React and Node.js customer portal with REST APIs",
        ],
        reason: "Candidate has useful software background but misses core backend stack and required experience for this JD.",
        risks: ["Skill direction is frontend/full-stack rather than Python backend", "Below required experience years"],
        scoredAt: "2026-06-20T09:50:00Z",
    },
];
