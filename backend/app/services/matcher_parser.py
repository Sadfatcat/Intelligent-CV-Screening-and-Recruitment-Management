"""Bộ tách section (parser) cho CV và JD.

Nhiệm vụ: đọc text thô, nhận diện các tiêu đề (Experience, Skills, Requirements...)
rồi gom nội dung vào đúng section. Đây là bước ĐẦU TIÊN của pipeline chấm điểm,
nên hay bị hỏi: "làm sao biết đoạn này là kinh nghiệm, đoạn kia là kỹ năng?".
Câu trả lời nằm ở _section_for_heading + HEADING_PHRASE_MAP/SECTION_SYNONYMS.
"""

import re
from typing import Dict

from app.services.matcher_config import (
    HEADING_PHRASE_MAP,
    INTERNAL_SECTION_KEYS,
    SECTION_LABELS,
    SECTION_SYNONYMS,
)
from app.services.matcher_text import _line_blocks, _normalize_token


def _section_for_heading(line: str) -> str | None:
    """Nhận diện 1 dòng có phải tiêu đề section không, trả về khóa section hoặc None."""
    lowered = _normalize_token(re.sub(r"^\d+[\).\s-]+", "", line)).rstrip(":")
    word_count = len(lowered.split())
    is_heading_length = word_count <= 8  # tiêu đề thường ngắn, tối đa 8 từ

    if is_heading_length:
        mapped = HEADING_PHRASE_MAP.get(lowered)
        if mapped:
            return mapped

    # Trường hợp "Skills: Python, ..." -> lấy phần trước dấu ':' để tra bản đồ.
    if ":" in line:
        before_colon = _normalize_token(line.split(":", 1)[0]).rstrip(":")
        mapped = HEADING_PHRASE_MAP.get(before_colon)
        if mapped:
            return mapped

    for section, keywords in SECTION_SYNONYMS.items():
        for keyword in keywords:
            if lowered == keyword or lowered.startswith(f"{keyword}:"):
                return section
    return None


def _split_sections(text: str, default_section: str) -> Dict[str, str]:
    """Chia toàn bộ text thành dict {section: nội dung}. Dòng trước tiêu đề đầu tiên rơi vào default_section."""
    sections = {section: "" for section in SECTION_LABELS}
    sections["requirements"] = ""
    sections["preferred"] = ""
    sections["summary"] = ""
    sections["ignored"] = ""
    current = default_section

    for line in _line_blocks(text):
        heading = _section_for_heading(line)
        if heading:
            current = heading
            # Nếu tiêu đề có nội dung ngay sau dấu ':' thì gộp luôn vào section.
            after_colon = line.split(":", 1)[1].strip() if ":" in line else ""
            if after_colon:
                if current in INTERNAL_SECTION_KEYS:
                    sections[current] = f"{sections.get(current, '')}\n{after_colon}".strip()
            continue
        if current in INTERNAL_SECTION_KEYS:
            sections[current] = f"{sections.get(current, '')}\n{line}".strip()

    return sections


def parse_sections_cv(text: str) -> Dict[str, str]:
    """Tách CV thành các section chuẩn (mặc định phần đầu là summary)."""
    sections = _split_sections(text, "summary")
    return {
        "summary": sections.get("summary", ""),
        "skills": sections.get("technical_skills", ""),
        "technical_skills": sections.get("technical_skills", ""),
        "experience": sections.get("experience", ""),
        "projects": sections.get("projects", ""),
        "education": sections.get("education", ""),
        "certifications": sections.get("certificates", ""),
        "certificates": sections.get("certificates", ""),
        "coding_languages": sections.get("programming_languages", ""),
        "programming_languages": sections.get("programming_languages", ""),
        "languages": sections.get("natural_languages", ""),
        "natural_languages": sections.get("natural_languages", ""),
        "soft_skills": sections.get("soft_skills", ""),
        "responsibilities": sections.get("responsibilities", ""),
    }


def parse_sections_jd(text: str) -> Dict[str, str]:
    """Tách JD thành các trường yêu cầu (mặc định phần đầu là requirements)."""
    sections = _split_sections(text, "requirements")
    required_text = " ".join([sections.get("requirements", ""), sections.get("technical_skills", "")]).strip()
    return {
        "job_title": sections.get("summary", ""),
        "required_skills": required_text,
        "required_experience": sections.get("experience", "") or (required_text if re.search(r"\b(years?|months?|experience)\b", required_text, flags=re.I) else ""),
        "education_requirement": sections.get("education", ""),
        "language_requirement": sections.get("natural_languages", ""),
        "preferred_skills": sections.get("preferred", ""),
        "soft_skills": sections.get("soft_skills", ""),
        "responsibilities": sections.get("responsibilities", ""),
    }
