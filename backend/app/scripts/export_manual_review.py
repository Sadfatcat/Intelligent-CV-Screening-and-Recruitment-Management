import csv
import json
import os
import re
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, text


ROOT_DIR = Path(__file__).resolve().parents[3]
EVALUATION_DIR = ROOT_DIR / "evaluation"
MOCK_DATA_PATH = ROOT_DIR / "src" / "mock" / "cvScreeningMockData.ts"
REVIEW_COLUMNS = [
    "case_id",
    "application_id",
    "job_id",
    "cv_id",
    "jd_name",
    "cv_name",
    "candidate_email",
    "existing_system_score",
    "source",
    "matched_evidence",
    "missing_evidence",
    "job_requirements_summary",
    "cv_profile_summary",
    "jd_text_excerpt",
    "cv_text_excerpt",
    "evidence_quality",
]

WORKBOOK_COLUMNS = REVIEW_COLUMNS + ["human_label", "human_relevance", "reason"]


def _compact_items(items: list[Any], limit: int = 8) -> str:
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


def _array_block(source: str, const_name: str) -> str:
    marker = f"const {const_name}:"
    start = source.find(marker)
    if start == -1:
        return ""
    assignment = source.find("=", start)
    if assignment == -1:
        return ""
    bracket_start = source.find("[", assignment)
    if bracket_start == -1:
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


def _database_urls() -> list[str]:
    urls = []
    for key in ("EVALUATION_DATABASE_URL", "DATABASE_URL"):
        value = os.getenv(key)
        if value:
            urls.append(value)
    env_file = ROOT_DIR / "backend" / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("DATABASE_URL="):
                urls.append(line.split("=", 1)[1].strip())
    expanded: list[str] = []
    for url in urls:
        expanded.append(url)
        if "@db:" in url:
            expanded.append(url.replace("@db:5432/", "@127.0.0.1:5434/"))
            expanded.append(url.replace("@db:5432/", "@127.0.0.1:5432/"))
    deduped: list[str] = []
    for url in expanded:
        if url and url not in deduped:
            deduped.append(url)
    return deduped


def _parse_matching_detail(raw_detail: str | None) -> tuple[str, str]:
    if not raw_detail:
        return "Not verified", "Not verified"
    try:
        detail = json.loads(raw_detail)
    except json.JSONDecodeError:
        return "Not verified", "Not verified"

    good = list(detail.get("good_points") or [])
    missing = list(detail.get("missing_points") or [])
    for section in detail.get("sections") or []:
        if isinstance(section, dict):
            good.extend(section.get("good") or [])
            missing.extend(section.get("missing") or [])
    must_have = detail.get("must_have") or {}
    if isinstance(must_have, dict):
        good.extend([f"{item} matched" for item in must_have.get("matched") or []])
        missing.extend([f"{item} missing" for item in must_have.get("missing") or []])
    return _compact_items(good), _compact_items(missing)


def _clean_text(value: Any) -> str:
    text_value = "" if value is None else str(value)
    return " ".join(text_value.split()).strip()


def _not_available(value: Any) -> str:
    cleaned = _clean_text(value)
    return cleaned if cleaned else "Not available"


def _excerpt(value: Any, limit: int = 900) -> str:
    cleaned = _clean_text(value)
    if not cleaned:
        return "Not available"
    return cleaned[:limit] + ("..." if len(cleaned) > limit else "")


def _join_summary(parts: list[Any], limit: int = 12) -> str:
    return _compact_items([part for part in parts if _clean_text(part)], limit=limit).replace("Not verified", "Not available")


def _evidence_quality(row: dict[str, str]) -> str:
    has_job = row["job_requirements_summary"] != "Not available" or row["jd_text_excerpt"] != "Not available"
    has_cv = row["cv_profile_summary"] != "Not available" or row["cv_text_excerpt"] != "Not available"
    has_matching = row["matched_evidence"] != "Not verified" or row["missing_evidence"] != "Not verified"
    if has_job and has_cv and has_matching:
        return "sufficient"
    if (has_job and has_cv) or has_matching or has_job or has_cv:
        return "partial"
    return "insufficient"


def _write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def _score(value: Any) -> str:
    if value is None or value == "":
        return ""
    try:
        return str(round(float(value), 3))
    except (TypeError, ValueError):
        return str(value)


def _extract_database_rows(start_case_id: int) -> tuple[list[dict[str, str]], str]:
    query = text("""
        SELECT
            ja.id AS application_id,
            ja.job_id AS job_id,
            ja.cv_id AS cv_id,
            j.title AS jd_name,
            j.description AS job_description,
            j.jd_parsed_text AS jd_parsed_text,
            COALESCE(c.candidate_name, c.candidate_email, c.file_path) AS cv_name,
            c.candidate_email AS candidate_email,
            c.file_path AS cv_file_path,
            c.parsed_text AS cv_parsed_text,
            ja.ai_matching_score AS existing_system_score,
            ja.matching_detail AS matching_detail
        FROM jobapplication ja
        LEFT JOIN job j ON j.id = ja.job_id
        LEFT JOIN cv c ON c.id = ja.cv_id
        ORDER BY ja.id
    """)
    last_error = "No database URL available"
    for url in _database_urls():
        try:
            engine = create_engine(url)
            with engine.connect() as conn:
                records = conn.execute(query).mappings().all()
        except Exception as exc:
            last_error = f"{type(exc).__name__}: {exc}"
            continue

        rows: list[dict[str, str]] = []
        case_id = start_case_id
        for record in records:
            matched, missing = _parse_matching_detail(record.get("matching_detail"))
            job_summary = _not_available(record.get("job_description"))
            cv_summary = _not_available(record.get("cv_parsed_text"))
            row = {
                "case_id": str(case_id),
                "application_id": str(record.get("application_id") or ""),
                "job_id": str(record.get("job_id") or ""),
                "cv_id": str(record.get("cv_id") or ""),
                "jd_name": str(record.get("jd_name") or "Not available"),
                "cv_name": str(record.get("cv_name") or Path(str(record.get("cv_file_path") or "")).name or "Not available"),
                "candidate_email": str(record.get("candidate_email") or "Not available"),
                "existing_system_score": _score(record.get("existing_system_score")),
                "source": "database_jobapplication",
                "matched_evidence": matched,
                "missing_evidence": missing,
                "job_requirements_summary": job_summary,
                "cv_profile_summary": cv_summary,
                "jd_text_excerpt": _excerpt(record.get("jd_parsed_text") or record.get("job_description")),
                "cv_text_excerpt": _excerpt(record.get("cv_parsed_text")),
                "evidence_quality": "",
            }
            row["evidence_quality"] = _evidence_quality(row)
            rows.append(row)
            case_id += 1
        return rows, f"database rows exported: {len(rows)}"
    return [], f"database unavailable: {last_error}"


def _mock_jobs(source: str) -> dict[str, dict[str, str]]:
    jobs: dict[str, dict[str, str]] = {}
    for block in _object_blocks(_array_block(source, "MOCK_JOB_DESCRIPTIONS_SOURCE")):
        job_id = _number_field(block, "id")
        if not job_id:
            continue
        required_skills = _string_array_field(block, "requiredSkills")
        preferred_skills = _string_array_field(block, "preferredSkills")
        responsibilities = _string_array_field(block, "responsibilities")
        requirements = _string_array_field(block, "requirements")
        nice_to_have = _string_array_field(block, "niceToHave")
        keywords = _string_array_field(block, "keywords")
        required_years = _number_field(block, "requiredExperienceYears")
        education = _string_field(block, "educationRequirement")
        languages = _string_array_field(block, "languageRequirements")
        jobs[job_id] = {
            "title": _string_field(block, "title"),
            "summary": _join_summary([
                f"Required skills: {', '.join(required_skills)}" if required_skills else "",
                f"Preferred skills: {', '.join(preferred_skills)}" if preferred_skills else "",
                f"Required experience years: {required_years}" if required_years else "",
                f"Education: {education}" if education else "",
                f"Languages: {', '.join(languages)}" if languages else "",
                f"Requirements: {'; '.join(requirements)}" if requirements else "",
                f"Responsibilities: {'; '.join(responsibilities)}" if responsibilities else "",
                f"Nice to have: {', '.join(nice_to_have)}" if nice_to_have else "",
                f"Keywords: {', '.join(keywords)}" if keywords else "",
            ]),
            "text": _join_summary([
                f"Title: {_string_field(block, 'title')}",
                f"Company: {_string_field(block, 'company')}",
                f"Level: {_string_field(block, 'level')}",
                f"Location: {_string_field(block, 'location')}",
                f"Required skills: {', '.join(required_skills)}" if required_skills else "",
                f"Preferred skills: {', '.join(preferred_skills)}" if preferred_skills else "",
                f"Required experience years: {required_years}" if required_years else "",
                f"Education: {education}" if education else "",
                f"Languages: {', '.join(languages)}" if languages else "",
                f"Requirements: {'; '.join(requirements)}" if requirements else "",
                f"Responsibilities: {'; '.join(responsibilities)}" if responsibilities else "",
                f"Nice to have: {', '.join(nice_to_have)}" if nice_to_have else "",
            ], limit=20),
        }
    return jobs


def _mock_candidates(source: str) -> dict[str, dict[str, str]]:
    candidates: dict[str, dict[str, str]] = {}
    for block in _object_blocks(_array_block(source, "MOCK_CANDIDATES_SOURCE")):
        cv_id = _number_field(block, "id")
        if not cv_id:
            continue
        skills = _string_array_field(block, "skills")
        languages = _string_array_field(block, "languages")
        projects = _string_array_field(block, "projects")
        certifications = _string_array_field(block, "certifications")
        work_experience = _string_array_field(block, "workExperience")
        experience_years = _number_field(block, "experienceYears")
        education = _string_field(block, "education")
        summary = _string_field(block, "summary")
        candidates[cv_id] = {
            "candidate_name": _string_field(block, "candidateName"),
            "email": _string_field(block, "email"),
            "cv_file_name": _string_field(block, "cvFileName"),
            "summary": _join_summary([
                summary,
                f"Target position: {_string_field(block, 'targetPosition')}",
                f"Skills: {', '.join(skills)}" if skills else "",
                f"Experience years: {experience_years}" if experience_years else "",
                f"Education: {education}" if education else "",
                f"Languages: {', '.join(languages)}" if languages else "",
                f"Projects: {'; '.join(projects)}" if projects else "",
                f"Certifications: {', '.join(certifications)}" if certifications else "",
                f"Work experience: {'; '.join(work_experience)}" if work_experience else "",
            ], limit=16),
            "text": _join_summary([
                f"Candidate: {_string_field(block, 'candidateName')}",
                summary,
                f"Target position: {_string_field(block, 'targetPosition')}",
                f"Skills: {', '.join(skills)}" if skills else "",
                f"Experience years: {experience_years}" if experience_years else "",
                f"Education: {education}" if education else "",
                f"Languages: {', '.join(languages)}" if languages else "",
                f"Projects: {'; '.join(projects)}" if projects else "",
                f"Certifications: {', '.join(certifications)}" if certifications else "",
                f"Work experience: {'; '.join(work_experience)}" if work_experience else "",
            ], limit=20),
        }
    return candidates


def _extract_mock_rows(start_case_id: int) -> list[dict[str, str]]:
    if not MOCK_DATA_PATH.exists():
        return []
    source = MOCK_DATA_PATH.read_text(encoding="utf-8")
    jobs = _mock_jobs(source)
    candidates = _mock_candidates(source)
    rows: list[dict[str, str]] = []
    case_id = start_case_id
    for block in _object_blocks(_array_block(source, "MOCK_MATCHING_RESULTS_SOURCE")):
        result_id = _number_field(block, "id")
        job_id = _number_field(block, "jdId")
        cv_id = _number_field(block, "cvId")
        if not result_id or not job_id or not cv_id:
            continue
        job = jobs.get(job_id, {})
        candidate = candidates.get(cv_id, {})
        matched = (
            _string_array_field(block, "matchedSkills")
            + _string_array_field(block, "matchedExperience")
            + _string_array_field(block, "relevantProjects")
        )
        missing = _string_array_field(block, "missingSkills") + _string_array_field(block, "missingRequirements")
        row = {
            "case_id": str(case_id),
            "application_id": f"mock-{result_id}",
            "job_id": job_id,
            "cv_id": cv_id,
            "jd_name": _string_field(block, "jdTitle") or job.get("title") or "Not available",
            "cv_name": candidate.get("cv_file_name") or _string_field(block, "candidateName") or "Not available",
            "candidate_email": candidate.get("email") or "Not available",
            "existing_system_score": _number_field(block, "overallScore"),
            "source": "frontend_mock_data",
            "matched_evidence": _compact_items(matched),
            "missing_evidence": _compact_items(missing),
            "job_requirements_summary": job.get("summary") or "Not available",
            "cv_profile_summary": candidate.get("summary") or "Not available",
            "jd_text_excerpt": _excerpt(job.get("text")),
            "cv_text_excerpt": _excerpt(candidate.get("text")),
            "evidence_quality": "",
        }
        row["evidence_quality"] = _evidence_quality(row)
        rows.append(row)
        case_id += 1
    return rows


def main() -> None:
    EVALUATION_DIR.mkdir(exist_ok=True)
    database_rows, database_status = _extract_database_rows(1)
    mock_rows = _extract_mock_rows(len(database_rows) + 1)
    rows = database_rows + mock_rows

    review_path = EVALUATION_DIR / "evaluation_manual_review.csv"
    workbook_path = EVALUATION_DIR / "evaluation_labelling_workbook.csv"
    readme_path = EVALUATION_DIR / "evaluation_manual_review_README.md"

    _write_csv(review_path, REVIEW_COLUMNS, rows)
    _write_csv(workbook_path, WORKBOOK_COLUMNS, [
        {**row, "human_label": "", "human_relevance": "", "reason": ""}
        for row in rows
    ])

    counts = {
        "sufficient": sum(1 for row in rows if row["evidence_quality"] == "sufficient"),
        "partial": sum(1 for row in rows if row["evidence_quality"] == "partial"),
        "insufficient": sum(1 for row in rows if row["evidence_quality"] == "insufficient"),
    }
    recommended = [
        row["case_id"]
        for row in rows
        if row["evidence_quality"] in {"sufficient", "partial"}
    ]
    readme_path.write_text(
        "\n".join([
            "# Manual CV-JD Evaluation Review",
            "",
            "Use `evaluation_labelling_workbook.csv` to assign human labels manually.",
            "",
            "Label mapping:",
            "- High = 2",
            "- Medium = 1",
            "- Low = 0",
            "",
            "Rules:",
            "- Do not use system score as ground truth.",
            "- Review the JD summary/excerpt, CV summary/excerpt, matched evidence, and missing evidence.",
            "- Leave `human_label`, `human_relevance`, and `reason` blank if `evidence_quality` is `insufficient`.",
            "- This is a preliminary manually labelled evaluation set, not a formal benchmark.",
            "",
            f"Rows exported: {len(rows)}",
            f"Sufficient evidence: {counts['sufficient']}",
            f"Partial evidence: {counts['partial']}",
            f"Insufficient evidence: {counts['insufficient']}",
            f"Recommended case IDs for manual labelling: {', '.join(recommended) if recommended else 'None'}",
            "",
            f"Source status: {database_status}; mock rows exported: {len(mock_rows)}.",
        ]),
        encoding="utf-8",
    )

    print(f"Wrote {review_path.relative_to(ROOT_DIR)} ({len(rows)} rows)")
    print(f"Wrote {workbook_path.relative_to(ROOT_DIR)} ({len(rows)} rows)")
    print(f"Wrote {readme_path.relative_to(ROOT_DIR)}")
    print(f"sufficient={counts['sufficient']} partial={counts['partial']} insufficient={counts['insufficient']}")
    print(f"recommended_case_ids={', '.join(recommended) if recommended else 'None'}")


if __name__ == "__main__":
    main()
