import { readFileSync } from "node:fs";

const recruiterCss = readFileSync("src/app/recruiter_UI/page.module.css", "utf8");
const candidateDarkCss = readFileSync("src/app/candidate_UI/page.dark.module.css", "utf8");
const candidateBrightCss = readFileSync("src/app/candidate_UI/page.bright.module.css", "utf8");
const candidatePage = readFileSync("src/app/candidate_UI/page.tsx", "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const recruiterRequired = [
    "--control-bg",
    "--control-bg-soft",
    "--strong-text",
    ".themeDark",
    ".filterInput::placeholder",
    ".jobManagementList",
    "overflow-x: auto",
    ".jobItemWrap",
    ".jobStatusPill",
    ".statusPassed",
    ".statusBorderline",
    ".statusFailed",
    ".statusNotScored",
    ".matchingExplanation",
];

for (const snippet of recruiterRequired) {
    assert(recruiterCss.includes(snippet), `Missing recruiter theme CSS snippet: ${snippet}`);
}

assert(candidateDarkCss.includes("color") && candidateDarkCss.includes("background"), "Candidate dark CSS must define readable color/background.");
assert(candidateBrightCss.includes("color") && candidateBrightCss.includes("background"), "Candidate bright CSS must define readable color/background.");
for (const snippet of [".jobTitleInput", ".uploadTextSelected", ".modalInput::placeholder", ".phonePrefix"]) {
    assert(candidateDarkCss.includes(snippet), `Missing candidate dark modal CSS snippet: ${snippet}`);
    assert(candidateBrightCss.includes(snippet), `Missing candidate bright modal CSS snippet: ${snippet}`);
}
for (const snippet of [".toast", ".toastSuccess", ".toastError", "toastSlideIn"]) {
    assert(recruiterCss.includes(snippet), `Missing recruiter toast CSS snippet: ${snippet}`);
    assert(candidateDarkCss.includes(snippet), `Missing candidate dark toast CSS snippet: ${snippet}`);
    assert(candidateBrightCss.includes(snippet), `Missing candidate bright toast CSS snippet: ${snippet}`);
}
assert(candidatePage.includes("styles.jobTitleInput"), "Candidate CV modal job title input must use theme-safe CSS class.");
assert(candidatePage.includes("styles.uploadTextSelected"), "Candidate CV modal selected-file text must use theme-safe CSS class.");
assert(candidatePage.includes("styles.toast"), "Candidate flow must render toast notifications for CV submission status.");
assert(!candidatePage.includes('style={{ background: "#f9f9f9"'), "Candidate CV modal must not use light-only inline job title background.");
assert(!candidatePage.includes('style={{ color: "green"'), "Candidate CV modal must not use inline selected-file color.");
assert(!recruiterCss.includes("opacity: 0.2"), "Main recruiter UI should not use very low text opacity.");
assert(!recruiterCss.includes("opacity: 0.3"), "Main recruiter UI should not use very low text opacity.");

console.log("theme CSS verification passed");
