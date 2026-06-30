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
    "ENABLE_DEV_MOCK_DATA",
    "FINT_MOCK_APPLICATIONS_STORAGE_KEY",
    "saveFintMockApplication",
    "fetch(apiUrl(\"/api/jobs/\")",
    "fetch(apiUrl(\"/api/cvs/upload-cv\")",
    "loadSubmittedJobs",
    "/api/cvs/candidate/",
];

for (const snippet of requiredCandidateSnippets) {
    assert(source.includes(snippet), `Missing candidate flow snippet: ${snippet}`);
}

assert(jobCard.includes("props.job") || jobCard.includes("job"), "Jobcard component should still render job data.");
assert(source.includes("if (!ENABLE_DEV_MOCK_DATA) return;"), "Mock application writes must be gated off by default.");
assert(source.includes("setJobs(ENABLE_DEV_MOCK_DATA ? [...normalizedJobs, ...MOCK_CANDIDATE_JOBS] : normalizedJobs);"), "Candidate jobs should only append mock jobs behind the dev flag.");
assert(source.includes(".catch(() => setJobs([]));"), "Candidate job loading should not fall back to mock jobs on API failure.");
assert(!source.includes("if (/internal server error/i.test(msg))"), "Candidate submit flow should not fake success on backend failure.");
assert(mockData.includes("requiredExperienceYears"), "Mock source should remain available for dev-only use.");

console.log("candidate flow verification passed");
