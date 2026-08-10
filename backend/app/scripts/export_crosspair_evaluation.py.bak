import csv
import json
import re
from pathlib import Path
from typing import Any

from app.services.matcher import score_cv_vs_jd


ROOT_DIR = Path(__file__).resolve().parents[3]
EVALUATION_DIR = ROOT_DIR / "evaluation"
MOCK_DATA_PATH = ROOT_DIR / "src" / "mock" / "cvScreeningMockData.ts"

JD_FILE = EVALUATION_DIR / "danh_sach_jd_mock.csv"
CV_FILE = EVALUATION_DIR / "danh_sach_cv_mock.csv"
RULES_FILE = EVALUATION_DIR / "quy_tac_ghep_cap_crosspair.md"
CANDIDATES_FILE = EVALUATION_DIR / "ung_vien_crosspair.csv"
LABEL_TEMPLATE_FILE = EVALUATION_DIR / "mau_gan_nhan_crosspair.csv"

JD_COLUMNS = [
    "jd_id",
    "jd_name",
    "role_category",
    "jd_source",
    "jd_text",
    "requirements_summary",
    "core_skills",
    "experience_requirement",
]

CV_COLUMNS = [
    "cv_id",
    "cv_name",
    "candidate_email",
    "cv_source",
    "cv_text",
    "profile_summary",
    "skills_summary",
    "experience_summary",
    "role_category",
]

CROSSPAIR_COLUMNS = [
    "case_id",
    "jd_id",
    "cv_id",
    "jd_name",
    "cv_name",
    "candidate_email",
    "pair_type",
    "source",
    "evidence_quality",
    "job_requirements_summary",
    "cv_profile_summary",
    "matched_evidence",
    "missing_evidence",
    "system_score",
]

LABEL_COLUMNS = CROSSPAIR_COLUMNS + ["human_label", "human_relevance", "reason"]

PAIR_PLAN = [
    (101, 201, "original_positive"),
    (101, 213, "cross_pair_medium"),
    (101, 214, "cross_pair_medium"),
    (101, 220, "hard_negative"),
    (101, 217, "easy_negative"),
    (102, 202, "original_positive"),
    (102, 221, "cross_pair_medium"),
    (102, 215, "cross_pair_medium"),
    (102, 222, "hard_negative"),
    (102, 217, "easy_negative"),
    (104, 203, "original_positive"),
    (104, 218, "cross_pair_medium"),
    (104, 204, "cross_pair_medium"),
    (104, 207, "hard_negative"),
    (104, 217, "easy_negative"),
    (105, 218, "original_positive"),
    (105, 209, "cross_pair_medium"),
    (105, 203, "cross_pair_medium"),
    (105, 206, "hard_negative"),
    (105, 217, "easy_negative"),
    (110, 207, "original_positive"),
    (110, 219, "cross_pair_medium"),
    (110, 201, "cross_pair_medium"),
    (110, 208, "hard_negative"),
    (110, 217, "easy_negative"),
]


def _array_block(source: str, const_name: str) -> str:
    marker = f"const {const_name}:"
    start = source.find(marker)
    if start == -1:
        return ""
    assignment = source.find("=", start)
    bracket_start = source.find("[", assignment)
    if assignment == -1 or bracket_start == -1:
        return ""

    depth = 0
    in_string: str | None = None
    escape = False
    for index in range(bracket_start, len(source)):
        char = source[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == in_string:
                in_string = None
            continue
        if char in {"'", '"', "`"}:
            in_string = char
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return source[bracket_start + 1:index]
    return ""


def _object_blocks(array_source: str) -> list[str]:
    blocks: list[str] = []
    depth = 0
    start: int | None = None
    in_string: str | None = None
    escape = False
    for index, char in enumerate(array_source):
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == in_string:
                in_string = None
            continue
        if char in {"'", '"', "`"}:
            in_string = char
        elif char == "{":
            if depth == 0:
                start = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and start is not None:
                blocks.append(array_source[start:index + 1])
                start = None
    return blocks


def _number_field(block: str, name: str) -> str:
    match = re.search(rf"\b{name}:\s*(-?\d+(?:\.\d+)?)", block)
    return match.group(1) if match else ""


def _string_field(block: str, name: str) -> str:
    match = re.search(rf"\b{name}:\s*(null|undefined|\"([^\"]*)\")", block, re.DOTALL)
    if not match or match.group(1) in {"null", "undefined"}:
        return ""
    return match.group(2).strip()


def _string_array_field(block: str, name: str) -> list[str]:
    match = re.search(rf"\b{name}:\s*\[(.*?)\]", block, re.DOTALL)
    if not match:
        return []
    return [item.strip() for item in re.findall(r'"([^"]*)"', match.group(1)) if item.strip()]


def _compact_items(items: list[Any], limit: int = 10) -> str:
    values: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item is None:
            continue
        text_value = str(item).strip()
        normalized = text_value.casefold()
        if text_value and normalized not in seen:
            seen.add(normalized)
            values.append(text_value)
    if not values:
        return "Not verified"
    shown = values[:limit]
    suffix = f"; ... (+{len(values) - limit} more)" if len(values) > limit else ""
    return "; ".join(shown) + suffix


def _role_category(text: str) -> str:
    value = text.casefold()
    if "frontend" in value:
        return "frontend"
    if "backend" in value or "architect" in value or "legacy" in value:
        return "backend"
    if "full stack" in value:
        return "fullstack"
    if "data engineer" in value:
        return "data_engineering"
    if "data analyst" in value or "analytics" in value:
        return "data_analytics"
    if "machine learning" in value or "ai engineer" in value or "nlp" in value:
        return "ai_ml"
    if "devops" in value or "cloud" in value:
        return "cloud_devops"
    if "mobile" in value:
        return "mobile"
    if "qa" in value or "tester" in value:
        return "qa"
    if "designer" in value or "ui/ux" in value:
        return "design"
    if "product manager" in value:
        return "product"
    if "business analyst" in value:
        return "business_analysis"
    if "security" in value:
        return "security"
    if "sales" in value:
        return "sales"
    return "other"


def _join(parts: list[Any], sep: str = "; ") -> str:
    values = [str(part).strip() for part in parts if part and str(part).strip()]
    return sep.join(values) if values else "Not available"


def _job_text(job: dict[str, Any]) -> str:
    return "\n".join([
        f"Job title: {job['jd_name']}",
        f"Role category: {job['role_category']}",
        f"Level: {job.get('level', '')}",
        f"Required skills: {job['core_skills']}",
        f"Preferred skills: {job.get('preferred_skills', '')}",
        f"Required experience years: {job['experience_requirement']}",
        f"Education requirement: {job.get('education_requirement', '')}",
        f"Language requirements: {job.get('language_requirements', '')}",
        f"Responsibilities: {job.get('responsibilities', '')}",
        f"Requirements: {job.get('requirements_summary', '')}",
        f"Nice to have: {job.get('nice_to_have', '')}",
        f"Keywords: {job.get('keywords', '')}",
    ])


def _cv_text(cv: dict[str, Any]) -> str:
    return "\n".join([
        f"Candidate name: {cv['cv_name']}",
        f"Target position: {cv.get('target_position', '')}",
        f"Role category: {cv['role_category']}",
        f"Summary: {cv['profile_summary']}",
        f"Skills: {cv['skills_summary']}",
        f"Experience years: {cv.get('experience_years', '')}",
        f"Education: {cv.get('education', '')}",
        f"Languages: {cv.get('languages', '')}",
        f"Projects: {cv.get('projects', '')}",
        f"Certifications: {cv.get('certifications', '')}",
        f"Work experience: {cv['experience_summary']}",
    ])


def _read_mock_sources() -> tuple[dict[str, dict[str, str]], dict[str, dict[str, str]]]:
    source = MOCK_DATA_PATH.read_text(encoding="utf-8")

    jobs: dict[str, dict[str, str]] = {}
    for block in _object_blocks(_array_block(source, "MOCK_JOB_DESCRIPTIONS_SOURCE")):
        job_id = _number_field(block, "id")
        if not job_id:
            continue
        required_skills = _string_array_field(block, "requiredSkills")
        preferred_skills = _string_array_field(block, "preferredSkills")
        responsibilities = _string_array_field(block, "responsibilities")
        requirements = _string_array_field(block, "requirements")
        languages = _string_array_field(block, "languageRequirements")
        nice_to_have = _string_array_field(block, "niceToHave")
        keywords = _string_array_field(block, "keywords")
        title = _string_field(block, "title")
        required_years = _number_field(block, "requiredExperienceYears")
        job = {
            "jd_id": job_id,
            "jd_name": title or "Not available",
            "role_category": _role_category(title),
            "jd_source": "src/mock/cvScreeningMockData.ts:MOCK_JOB_DESCRIPTIONS_SOURCE",
            "requirements_summary": _join(requirements),
            "core_skills": _join(required_skills, ", "),
            "experience_requirement": f"{required_years} years" if required_years else "Not available",
            "level": _string_field(block, "level"),
            "preferred_skills": _join(preferred_skills, ", "),
            "education_requirement": _string_field(block, "educationRequirement") or "Not available",
            "language_requirements": _join(languages, ", "),
            "responsibilities": _join(responsibilities),
            "nice_to_have": _join(nice_to_have, ", "),
            "keywords": _join(keywords, ", "),
        }
        job["jd_text"] = _job_text(job)
        jobs[job_id] = job

    cvs: dict[str, dict[str, str]] = {}
    for block in _object_blocks(_array_block(source, "MOCK_CANDIDATES_SOURCE")):
        cv_id = _number_field(block, "id")
        if not cv_id:
            continue
        skills = _string_array_field(block, "skills")
        work_experience = _string_array_field(block, "workExperience")
        projects = _string_array_field(block, "projects")
        certifications = _string_array_field(block, "certifications")
        languages = _string_array_field(block, "languages")
        target_position = _string_field(block, "targetPosition")
        cv = {
            "cv_id": cv_id,
            "cv_name": _string_field(block, "cvFileName") or _string_field(block, "candidateName") or "Not available",
            "candidate_email": _string_field(block, "email") or "Not available",
            "cv_source": "src/mock/cvScreeningMockData.ts:MOCK_CANDIDATES_SOURCE",
            "profile_summary": _string_field(block, "summary") or "Not available",
            "skills_summary": _join(skills, ", "),
            "experience_summary": _join(work_experience),
            "role_category": _role_category(target_position),
            "target_position": target_position,
            "experience_years": _number_field(block, "experienceYears"),
            "education": _string_field(block, "education") or "Not available",
            "languages": _join(languages, ", "),
            "projects": _join(projects),
            "certifications": _join(certifications, ", "),
        }
        cv["cv_text"] = _cv_text(cv)
        cvs[cv_id] = cv

    return jobs, cvs


def _write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def _evidence_quality(job: dict[str, str] | None, cv: dict[str, str] | None, score: str) -> str:
    if not job or not cv:
        return "insufficient"
    if job.get("jd_text") and cv.get("cv_text") and score:
        return "sufficient"
    if job.get("jd_text") or cv.get("cv_text"):
        return "partial"
    return "insufficient"


def _score_pair(job: dict[str, str], cv: dict[str, str]) -> tuple[str, str, str]:
    result = score_cv_vs_jd(cv["cv_text"], job["jd_text"])
    score = result.get("final_score")
    good = list(result.get("good_points") or [])
    missing = list(result.get("missing_points") or [])
    must_have = result.get("must_have") or {}
    if isinstance(must_have, dict):
        good.extend([f"{item} matched" for item in must_have.get("matched") or []])
        missing.extend([f"{item} missing" for item in must_have.get("missing") or []])
    return f"{float(score):.3f}", _compact_items(good), _compact_items(missing)


def _crosspair_rows(jobs: dict[str, dict[str, str]], cvs: dict[str, dict[str, str]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for index, (jd_id, cv_id, pair_type) in enumerate(PAIR_PLAN, start=1):
        job = jobs.get(str(jd_id))
        cv = cvs.get(str(cv_id))
        score = ""
        matched = "Not verified"
        missing = "Not verified"
        if job and cv:
            score, matched, missing = _score_pair(job, cv)
        rows.append({
            "case_id": str(index),
            "jd_id": str(jd_id),
            "cv_id": str(cv_id),
            "jd_name": job["jd_name"] if job else "Not available",
            "cv_name": cv["cv_name"] if cv else "Not available",
            "candidate_email": cv["candidate_email"] if cv else "Not available",
            "pair_type": pair_type,
            "source": "frontend_mock_crosspair_recomputed",
            "evidence_quality": _evidence_quality(job, cv, score),
            "job_requirements_summary": job["requirements_summary"] if job else "Not available",
            "cv_profile_summary": cv["profile_summary"] if cv else "Not available",
            "matched_evidence": matched,
            "missing_evidence": missing,
            "system_score": score,
        })
    return rows


def _write_rules() -> None:
    RULES_FILE.write_text(
        "\n".join([
            "# Quy tac ghep cap CV-JD cross-pair",
            "",
            "Cross-pairs duoc tao de danh gia matcher khach quan hon so voi viec chi dung cac cap ung tuyen da co san. Neu mock CV da duoc ghep voi dung mock JD ngay tu dau, bo danh gia se qua de va khong kiem tra kha nang phan biet ung vien phu hop, gan phu hop va khong phu hop.",
            "",
            "Loai cap:",
            "- original_positive: CV va JD la cap dung vai tro trong mock data. Diem van duoc tinh lai bang matcher hien tai.",
            "- cross_pair_medium: CV khac vai tro nhung co mot phan ky nang/kinh nghiem lien quan, dung de tao truong hop borderline.",
            "- hard_negative: CV co mot vai tin hieu be ngoai co the gay nham lan nhung thieu yeu cau cot loi cua JD.",
            "- easy_negative: CV thuoc vai tro khac ro rang va thieu gan nhu toan bo yeu cau cot loi.",
            "",
            "Anh xa nhan con nguoi:",
            "- High = 2",
            "- Medium = 1",
            "- Low = 0",
            "",
            "Quy tac:",
            "- human_label, human_relevance va reason phai duoc sinh vien doc va gan nhan thu cong.",
            "- Khong dung system_score lam ground truth cho human_label.",
            "- Moi cap JD-CV trong bang cross-pair phai duoc tinh diem bang matcher hien tai tu jd_text va cv_text.",
            "- Diem cu tu application/mock result khong duoc dung lai cho cross-pair. Voi original_positive, script nay cung tinh lai diem de giu workflow nhat quan.",
            "- Neu thieu JD text hoac CV text, dong do phai de evidence_quality la insufficient va nen bo trong nhan con nguoi.",
        ]),
        encoding="utf-8",
    )


def main() -> None:
    EVALUATION_DIR.mkdir(exist_ok=True)
    jobs, cvs = _read_mock_sources()

    _write_csv(JD_FILE, JD_COLUMNS, [jobs[key] for key in sorted(jobs, key=int)])
    _write_csv(CV_FILE, CV_COLUMNS, [cvs[key] for key in sorted(cvs, key=int)])
    _write_rules()

    rows = _crosspair_rows(jobs, cvs)
    _write_csv(CANDIDATES_FILE, CROSSPAIR_COLUMNS, rows)
    _write_csv(LABEL_TEMPLATE_FILE, LABEL_COLUMNS, [
        {**row, "human_label": "", "human_relevance": "", "reason": ""}
        for row in rows
    ])

    counts = {
        "sufficient": sum(1 for row in rows if row["evidence_quality"] == "sufficient"),
        "partial": sum(1 for row in rows if row["evidence_quality"] == "partial"),
        "insufficient": sum(1 for row in rows if row["evidence_quality"] == "insufficient"),
    }
    print(f"Wrote {JD_FILE.relative_to(ROOT_DIR)} ({len(jobs)} mock JDs)")
    print(f"Wrote {CV_FILE.relative_to(ROOT_DIR)} ({len(cvs)} mock CVs)")
    print(f"Wrote {RULES_FILE.relative_to(ROOT_DIR)}")
    print(f"Wrote {CANDIDATES_FILE.relative_to(ROOT_DIR)} ({len(rows)} cross-pair rows)")
    print(f"Wrote {LABEL_TEMPLATE_FILE.relative_to(ROOT_DIR)}")
    print(json.dumps(counts, ensure_ascii=False))


if __name__ == "__main__":
    main()
