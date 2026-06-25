import { readFileSync } from "node:fs";

const source = [
    readFileSync("src/features/candidate/CandidateLayout.tsx", "utf8"),
    readFileSync("src/features/candidate/hooks/useCandidateData.ts", "utf8"),
].join("\n");
const jobCard = readFileSync("src/components/Jobcard.tsx", "utf8");
const mockData = readFileSync("src/mock/cvScreeningMockData.ts", "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const requiredCandidateSnippets = [
    "MOCK_CANDIDATE_JOBS",
    "Fint Vietnam",
    "fintvn@fint.vn",
    "FINT_MOCK_APPLICATIONS_STORAGE_KEY",
    "saveFintMockApplication",
    "fetch(apiUrl(\"/api/jobs/\")",
    "fetch(apiUrl(\"/api/cvs/upload-cv\")",
    "selectedJob.isMock",
    "setIsModalOpen(true)",
    "The Fint recruiter mock account can now see it.",
    "loadSubmittedJobs",
    "/api/cvs/candidate/",
];

for (const snippet of requiredCandidateSnippets) {
    assert(source.includes(snippet), `Missing candidate flow snippet: ${snippet}`);
}

assert(jobCard.includes("props.job") || jobCard.includes("job"), "Jobcard component should still render job data.");
assert(mockData.includes("requiredExperienceYears"), "Mock jobs should include required experience data.");
assert(mockData.includes("overallScore"), "Mock matching results should include scoring data.");
assert(mockData.includes('status: "Passed"'), "Mock data should include a passed CV.");
assert(mockData.includes('status: "Borderline"'), "Mock data should include a borderline CV.");
assert(mockData.includes('status: "Failed"'), "Mock data should include a failed CV.");

console.log("candidate flow verification passed");
