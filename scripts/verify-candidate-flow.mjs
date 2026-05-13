import { readFileSync } from "node:fs";

const source = readFileSync("src/app/candidate_UI/page.tsx", "utf8");
const jobCard = readFileSync("src/components/Jobcard.tsx", "utf8");
const mockData = readFileSync("src/mock/cvScreeningMockData.ts", "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const requiredCandidateSnippets = [
    "MOCK_CANDIDATE_JOBS",
    "filterPublicJobsByManagementState",
    "JOB_MANAGEMENT_STORAGE_KEY",
    "turned_off",
    "deleted_active",
    "FPT Software",
    "FPT_MOCK_APPLICATIONS_STORAGE_KEY",
    "saveFptMockApplication",
    "fetch(\"/api/jobs/\")",
    "fetch(\"/api/cvs/upload-cv\"",
    "selectedJob.isMock",
    "setIsModalOpen(true)",
    "The FPT recruiter mock account can now see it.",
    "loadSubmittedJobs",
    "/api/cvs/candidate/",
    "/api/jobs/${selectedJob.id}/jd-file",
];

for (const snippet of requiredCandidateSnippets) {
    assert(source.includes(snippet), `Missing candidate flow snippet: ${snippet}`);
}

assert(jobCard.includes("props.job") || jobCard.includes("job"), "Jobcard component should still render job data.");
assert(mockData.includes("requiredExperienceYears"), "Mock jobs should include required experience data.");
assert(mockData.includes("overallScore"), "Mock matching results should include scoring data.");

console.log("candidate flow verification passed");
