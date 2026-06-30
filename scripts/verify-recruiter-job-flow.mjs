import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const recruiterSource = [
    readFileSync(resolve(root, "src/features/recruiter/RecruiterLayout.tsx"), "utf8"),
    readFileSync(resolve(root, "src/features/recruiter/utils/recruiterMockMappers.ts"), "utf8"),
    readFileSync(resolve(root, "src/features/recruiter/hooks/useRecruiterData.ts"), "utf8"),
].join("\n");
const candidateSource = [
    readFileSync(resolve(root, "src/features/candidate/CandidateLayout.tsx"), "utf8"),
    readFileSync(resolve(root, "src/features/candidate/hooks/useCandidateData.ts"), "utf8"),
].join("\n");
const mockData = readFileSync(resolve(root, "src/mock/cvScreeningMockData.ts"), "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const requiredRecruiterSnippets = [
    "ENABLE_DEV_MOCK_DATA",
    "MOCK_RECRUITER_JOBS",
    "MOCK_FINT_CV_LOGS",
    "FINT_MOCK_APPLICATIONS_STORAGE_KEY",
    "readStoredFintMockCvLogs",
    "isFintSession",
];

for (const snippet of requiredRecruiterSnippets) {
    assert(recruiterSource.includes(snippet), `Missing recruiter flow snippet: ${snippet}`);
}

assert(candidateSource.includes("saveFintMockApplication"), "Candidate flow should keep the gated mock writer available.");
assert(recruiterSource.includes("if (!ENABLE_DEV_MOCK_DATA) return [];"), "Recruiter stored mock CV logs must be disabled by default.");
assert(recruiterSource.includes("if (!ENABLE_DEV_MOCK_DATA) return false;"), "Recruiter mock session activation must be disabled by default.");
assert(recruiterSource.includes("const isFintRecruiter = ENABLE_DEV_MOCK_DATA && isFintSession(session, companyName);"), "Recruiter mock data should only activate behind the dev flag.");
assert(!recruiterSource.includes("FPT"), "Recruiter source should not reference old FPT mock labels.");
assert(!candidateSource.includes("FPT"), "Candidate source should not reference old FPT mock labels.");
assert(mockData.match(/id: 501/g)?.length === 1, "Mock source should still expose one Fint demo job for dev-only mode.");

console.log("Recruiter job flow verification passed.");
