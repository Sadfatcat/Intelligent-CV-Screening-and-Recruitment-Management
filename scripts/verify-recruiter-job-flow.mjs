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
    "MOCK_RECRUITER_JOBS",
    "MOCK_FINT_CV_LOGS",
    "FINT_MOCK_APPLICATIONS_STORAGE_KEY",
    "readStoredFintMockCvLogs",
    "isFintSession",
    "fintvn@fint.vn",
    "Fint Vietnam",
];

for (const snippet of requiredRecruiterSnippets) {
    assert(recruiterSource.includes(snippet), `Missing recruiter flow snippet: ${snippet}`);
}

assert(candidateSource.includes("saveFintMockApplication"), "Candidate mock submit flow must write Fint mock applications.");
assert(!recruiterSource.includes("FPT"), "Recruiter source should not reference old FPT mock labels.");
assert(!candidateSource.includes("FPT"), "Candidate source should not reference old FPT mock labels.");
assert(mockData.match(/id: 501/g)?.length === 1, "Mock data should expose one Fint demo job.");
assert(mockData.match(/jdId: 501/g)?.length === 3, "Mock data should expose three CV scoring results for the same job.");
assert(mockData.includes('status: "Passed"'), "Mock data should include passed scoring.");
assert(mockData.includes('status: "Borderline"'), "Mock data should include borderline scoring.");
assert(mockData.includes('status: "Failed"'), "Mock data should include failed scoring.");

console.log("Recruiter job flow verification passed.");
