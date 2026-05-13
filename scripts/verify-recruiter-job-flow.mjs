import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const recruiterPage = readFileSync(resolve(root, "src/app/recruiter_UI/page.tsx"), "utf8");
const candidatePage = readFileSync(resolve(root, "src/app/candidate_UI/page.tsx"), "utf8");
const recruiterCss = readFileSync(resolve(root, "src/app/recruiter_UI/page.module.css"), "utf8");
const mockData = readFileSync(resolve(root, "src/mock/cvScreeningMockData.ts"), "utf8");

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const requiredEnglishLabels = [
    "Job List",
    "Submitted CVs",
    "CV Detail",
    "Enter job title and press Enter to search",
    "No matching job found.",
    "Please select a job first.",
    "No CVs have been submitted for this job yet.",
    "Please select a CV to view details.",
    "Turn Off",
    "Delete Job",
    "Deleted from Active Jobs",
    "role=\"status\"",
    "FPT_MOCK_APPLICATIONS_STORAGE_KEY",
    "readStoredFptMockCvLogs",
];

for (const label of requiredEnglishLabels) {
    assert(recruiterPage.includes(label), `Missing English label: ${label}`);
}

const forbiddenVietnameseFlowText = [
    "Danh sách công việc",
    "CV đã nộp",
    "Chi tiết CV",
    "Nhập tên công việc",
    "Không tìm thấy công việc",
    "Vui lòng chọn",
    "Chưa có CV",
    "Delete JD",
];

for (const label of forbiddenVietnameseFlowText) {
    assert(!recruiterPage.includes(label), `Old flow label still present: ${label}`);
}

assert(recruiterPage.includes("JOB_MANAGEMENT_STORAGE_KEY"), "Recruiter flow must persist local job management state.");
assert(candidatePage.includes("JOB_MANAGEMENT_STORAGE_KEY"), "Candidate public list must read local job management state.");
assert(candidatePage.includes("turned_off") && candidatePage.includes("deleted_active"), "Candidate public list must hide turned-off/deleted jobs.");
assert(!recruiterPage.includes("/jobs/${jobId}"), "Recruiter job deletion should not call the destructive backend delete endpoint in this flow.");
assert(!recruiterPage.includes("Click a row to inspect scoring detail."), "Dashboard overview must not advertise click-to-open CV detail.");
assert(recruiterPage.includes("setScoringSubTab(\"detail\")"), "CV Scoring tab must still support opening CV detail.");

const requiredCssClasses = [
    ".jobManagementList",
    ".jobActionGroup",
    ".turnOffJobBtn",
    ".restoreJobBtn",
    ".jobStatusPill",
    ".jobStatusTurnedOff",
    ".jobStatusDeleted",
    ".toast",
    ".toastSuccess",
    ".toastError",
    "--control-bg",
    "--strong-text",
    "overflow-x: auto",
];

for (const className of requiredCssClasses) {
    assert(recruiterCss.includes(className), `Missing theme/action CSS: ${className}`);
}

assert(mockData.includes("MOCK_JOB_DESCRIPTIONS_SOURCE.slice(0, 14)"), "Mock jobs must be reduced to 14 records.");
assert(mockData.includes("MOCK_CANDIDATES_SOURCE.slice(0, 14)"), "Mock candidates must be reduced to 14 records.");
assert(mockData.includes("MOCK_MATCHING_RESULTS_SOURCE.slice(0, 14)"), "Mock matching results must be reduced to 14 records.");

console.log("Recruiter job flow verification passed.");
