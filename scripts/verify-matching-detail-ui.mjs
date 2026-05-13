import { readFileSync } from "node:fs";

const source = readFileSync("src/app/recruiter_UI/page.tsx", "utf8");

const requiredSnippets = [
    "matching_detail",
    "Matching Details",
    "Why this score?",
    "Good",
    "Missing",
    "Must-have matched",
    "Must-have missing",
    "Detailed matching explanation is not available for this application.",
    "getRenderableMatchingSections",
    "renderableMatchingSections.length > 0",
    "section.good.map",
    "section.missing.map",
    "formatScore(selectedLog.ai_matching_score)",
];

const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

if (missing.length > 0) {
    throw new Error(`Missing recruiter matching-detail UI snippets: ${missing.join(", ")}`);
}

if (source.includes('formData.append("matching_config"')) {
    throw new Error("Recruiter JD form should still submit without matching_config in this phase");
}

console.log("matching detail UI verification passed");
