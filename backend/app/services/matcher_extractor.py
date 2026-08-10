"""Bộ trích xuất (extractor): rút thông tin có cấu trúc từ text của CV/JD.

Gồm 3 mảng chính:
1. Trích xuất bằng regex: email, số điện thoại, số năm/tháng kinh nghiệm.
2. Alias (từ đồng nghĩa kỹ năng): quy các cách viết khác nhau về 1 dạng chuẩn.
3. Trích danh sách "yêu cầu" (demands) từ JD và "bằng chứng" (evidence) từ CV.

Đây là phần lõi hay bị hỏi khi bảo vệ: "làm sao hệ thống biết ứng viên có bao nhiêu
năm kinh nghiệm / có kỹ năng gì?". Trả lời: dựa vào regex số năm + danh sách từ khóa
trong matcher_config, cộng thêm alias để nhận diện biến thể tên kỹ năng.
"""

import json
import re
from typing import Dict, List

from app.services.matcher_config import (
    ALIAS_PATH,
    CERTIFICATE_HINTS,
    NATURAL_LANGUAGES,
    PROGRAMMING_LANGUAGES,
    SECTION_LABELS,
    SKILL_HINTS,
    STRICT_SECTIONS,
)
from app.services.matcher_parser import _split_sections
from app.services.matcher_text import (
    _dedupe,
    _line_blocks,
    _list_blocks,
    _normalize_token,
)


# ---------------------------------------------------------------------------
# 1. Trích xuất bằng regex (thông tin liên hệ + số năm/tháng kinh nghiệm)
# ---------------------------------------------------------------------------
def regex_extract(text: str) -> Dict[str, List[str]]:
    """Rút email, số điện thoại, ngôn ngữ, số năm và số tháng bằng biểu thức chính quy."""
    out = {"emails": [], "phones": [], "languages": [], "years": [], "months": []}
    if not text:
        return out
    out["emails"] = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    out["phones"] = re.findall(r"(?:\+\d{1,3}[\s-]?)?(?:\d[\d\s-]{6,}\d)", text)
    out["languages"] = [
        lang for lang in sorted(NATURAL_LANGUAGES) if re.search(rf"\b{re.escape(lang)}\b", text, flags=re.I)
    ]
    out["years"] = re.findall(r"(\d+(?:\.\d+)?)\s+years?", text, flags=re.I)
    out["months"] = re.findall(r"(\d+(?:\.\d+)?)\s+months?", text, flags=re.I)
    # Hỗ trợ cả tiếng Nhật (年以上, 年間, ヶ月) và tiếng Việt (năm, tháng).
    out["years"].extend(re.findall(r"(\d+(?:\.\d+)?)\s*年以上", text))
    out["years"].extend(re.findall(r"(\d+(?:\.\d+)?)\s*年(?:間)?", text))
    out["years"].extend(re.findall(r"(\d+(?:\.\d+)?)\s*năm", text, flags=re.I))
    out["months"].extend(re.findall(r"(\d+(?:\.\d+)?)\s*ヶ月", text))
    out["months"].extend(re.findall(r"(\d+(?:\.\d+)?)\s*tháng", text, flags=re.I))
    return out


def _extract_year_values(text: str) -> List[float]:
    """Lấy tất cả giá trị 'số năm' xuất hiện trong text (giới hạn hợp lý 0-50 năm)."""
    if not text:
        return []
    values = []
    patterns = [
        r"(\d+(?:\.\d+)?)\s*\+?\s*years?",
        r"(\d+(?:\.\d+)?)\s*年以上",
        r"(\d+(?:\.\d+)?)\s*年(?:間)?",
        r"(\d+(?:\.\d+)?)\s*năm",
    ]
    for pattern in patterns:
        values.extend(float(value) for value in re.findall(pattern, text, flags=re.I))
    return [value for value in values if 0.0 < value <= 50.0]


def _extract_month_values(text: str) -> List[float]:
    """Lấy tất cả giá trị 'số tháng' xuất hiện trong text (giới hạn 0-600 tháng)."""
    if not text:
        return []
    values = []
    patterns = [
        r"(\d+(?:\.\d+)?)\s+months?",
        r"(\d+(?:\.\d+)?)\s*ヶ月",
        r"(\d+(?:\.\d+)?)\s*tháng",
    ]
    for pattern in patterns:
        values.extend(float(value) for value in re.findall(pattern, text, flags=re.I))
    return [value for value in values if 0.0 < value <= 600.0]


def extract_experience_years(text: str) -> float:
    """Tính tổng số năm kinh nghiệm của ứng viên = max(số năm) + max(số tháng)/12."""
    if not text:
        return 0.0
    years = _extract_year_values(text)
    months = _extract_month_values(text)
    total_years = max(years) if years else 0.0
    total_months = (max(months) / 12.0) if months else 0.0
    return total_years + total_months


def _required_experience_years(text: str) -> float:
    """Rút số năm kinh nghiệm mà JD YÊU CẦU. Ưu tiên dạng ghi rõ 'experience years: N'."""
    if not text:
        return 0.0
    explicit_years = re.search(r"\bexperience\s+years?\s*:\s*(\d+(?:\.\d+)?)\b", text, flags=re.I)
    if explicit_years:
        return float(explicit_years.group(1))
    years = _extract_year_values(text)
    if years:
        return float(years[0])
    months = _extract_month_values(text)
    if months:
        return float(months[0]) / 12.0
    return 0.0


# ---------------------------------------------------------------------------
# 2. Alias: quy các cách viết khác nhau của cùng 1 kỹ năng về dạng chuẩn
# ---------------------------------------------------------------------------
def load_aliases() -> Dict[str, List[str]]:
    """Đọc file skill_aliases.json (map: tên_chuẩn -> [các cách viết khác])."""
    try:
        with open(ALIAS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _load_alias_index(aliases: Dict[str, List[str]]) -> Dict[str, str]:
    """Đảo ngược bảng alias thành index: mọi biến thể -> tên chuẩn, để tra nhanh."""
    index = {}
    for canonical, forms in aliases.items():
        canonical_norm = _normalize_token(canonical)
        index[canonical_norm] = canonical_norm
        for form in forms:
            index[_normalize_token(form)] = canonical_norm
    return index


def _canonicalize_item(item: str, alias_index: Dict[str, str]) -> str:
    """Trả về tên chuẩn của 1 mục nếu có trong alias, ngược lại trả chính nó (đã chuẩn hóa)."""
    normalized = _normalize_token(item)
    return alias_index.get(normalized, normalized)


def map_skills(raw_skills_text: str, aliases: Dict[str, List[str]]) -> List[str]:
    """Trích danh sách kỹ năng kỹ thuật từ text (đã canonical hóa qua alias)."""
    alias_index = _load_alias_index(aliases)
    return _extract_section_items("technical_skills", raw_skills_text, alias_index)


# ---------------------------------------------------------------------------
# 3. Trích các mục theo section (kỹ năng, kinh nghiệm, chứng chỉ...)
# ---------------------------------------------------------------------------
def _extract_known_terms(text: str, terms: set[str], alias_index: Dict[str, str]) -> List[str]:
    """Tìm trong text những từ khóa nằm trong tập 'terms' (khớp nguyên từ, không dính chữ khác)."""
    lowered = f" {_normalize_token(text)} "
    found = []
    search_terms = set(terms)
    # Bổ sung cả các biến thể alias trỏ về những term cần tìm.
    search_terms.update(alias for alias, canonical in alias_index.items() if canonical in terms)

    # Duyệt term dài trước để "rest api" được ưu tiên hơn "rest".
    for term in sorted(search_terms, key=len, reverse=True):
        if not term:
            continue
        pattern = r"(?<![a-z0-9+#.])" + re.escape(term) + r"(?![a-z0-9+#.])"
        if re.search(pattern, lowered):
            canonical = _canonicalize_item(term, alias_index)
            found.append(canonical)
    return _dedupe(found)


def _extract_list_items(text: str, alias_index: Dict[str, str]) -> List[str]:
    """Tách một đoạn liệt kê thành các mục riêng, bỏ các từ khung như 'required', 'skills'..."""
    if not text:
        return []
    chunks = re.split(r"[,;\n•|/]| and | & ", text, flags=re.I)
    items = []
    for chunk in chunks:
        cleaned = re.sub(
            r"\b(required|requirements?|must have|preferred|nice to have|skills?|tools?|technologies?|languages?|certificates?)\b",
            "",
            chunk,
            flags=re.I,
        )
        cleaned = _normalize_token(cleaned)
        if not cleaned or len(cleaned.split()) > 5:
            continue
        items.append(_canonicalize_item(cleaned, alias_index))
    return _dedupe(items)


def _extract_section_items(section: str, text: str, alias_index: Dict[str, str]) -> List[str]:
    """Trích danh sách mục cho 1 section cụ thể. Mỗi loại section có cách trích riêng."""
    if section == "programming_languages":
        return _extract_known_terms(text, PROGRAMMING_LANGUAGES, alias_index)
    if section == "technical_skills":
        return _extract_known_terms(text, SKILL_HINTS | PROGRAMMING_LANGUAGES | set(alias_index.values()), alias_index)
    if section == "natural_languages":
        return _extract_known_terms(text, NATURAL_LANGUAGES, alias_index)
    if section == "certificates":
        return _extract_known_terms(text, CERTIFICATE_HINTS, alias_index)
    if section == "experience":
        # Với kinh nghiệm, ta cố tách ra các mốc "N years" từ từng dòng.
        items = []
        for line in _line_blocks(text):
            bare_years = re.fullmatch(r"\d+(?:\.\d+)?", line.strip())
            if bare_years:
                items.append(f"{bare_years.group(0)} years")
                continue
            if re.search(r"\b(years?|months?|experience|experienced)\b|年|ヶ月|経験", line, flags=re.I):
                explicit_years = re.search(r"\bexperience\s+years?\s*:\s*(\d+(?:\.\d+)?)\b", line, flags=re.I)
                if explicit_years:
                    items.append(f"{explicit_years.group(1)} years")
                    continue
                year_match = re.search(
                    r"(\d+(?:\.\d+)?\s*\+?\s+years?)",
                    line,
                    flags=re.I,
                )
                if year_match:
                    items.append(year_match.group(1))
                    continue
                jp_year_match = re.search(r"(\d+(?:\.\d+)?)\s*(年以上|年(?:間)?)", line)
                if jp_year_match:
                    items.append(f"{jp_year_match.group(1)} years")
        return items
    # Các section mô tả dài (dự án, trách nhiệm...) chỉ giữ mục có từ 2 từ trở lên.
    if section in {"experience", "projects", "responsibilities", "education", "soft_skills"}:
        return [item for item in _list_blocks(text) if len(item.split()) >= 2]
    return _extract_list_items(text, alias_index)


# ---------------------------------------------------------------------------
# 4. Tổng hợp: demands (yêu cầu từ JD) và evidence (bằng chứng từ CV)
# ---------------------------------------------------------------------------
def _extract_demands_from_jd(text: str, alias_index: Dict[str, str]) -> Dict[str, Dict[str, List[str]]]:
    """Trích toàn bộ yêu cầu của JD, phân thành 'required' (bắt buộc) và 'preferred' (ưu tiên)."""
    sections = _split_sections(text, "requirements")
    demands = {"required": {}, "preferred": {}}
    required_lines = []
    preferred_lines = []

    # Phân loại từng dòng theo dấu hiệu bắt buộc / ưu tiên.
    for line in _line_blocks(text):
        if re.search(r"\b(preferred|nice to have|plus|bonus|desired)\b", line, flags=re.I):
            preferred_lines.append(line)
        elif re.search(r"\b(required|must have|requirements?|minimum|need|needs)\b", line, flags=re.I):
            required_lines.append(line)

    required_text = " ".join(
        required_lines
        + [
            sections.get("requirements", ""),
            sections.get("technical_skills", ""),
            sections.get("experience", ""),
            sections.get("natural_languages", ""),
            sections.get("education", ""),
            sections.get("certificates", ""),
        ]
    )
    preferred_text = " ".join([sections.get("preferred", ""), *preferred_lines])

    for section in SECTION_LABELS:
        # Kỹ năng/ngôn ngữ/kinh nghiệm được gộp thêm khối required_text để bắt được yêu cầu rải rác.
        if section in {"technical_skills", "programming_languages", "experience", "natural_languages"}:
            source_text = f"{sections.get(section, '')} {required_text}"
        elif section in {"education", "certificates"}:
            source_text = sections.get(section, "")
        elif section == "responsibilities":
            source_text = sections.get("responsibilities", "")
        elif section == "projects":
            source_text = sections.get("projects", "")
        elif section == "soft_skills":
            source_text = sections.get("soft_skills", "")
        else:
            source_text = sections.get(section, "")
        demands["required"][section] = _extract_section_items(section, source_text, alias_index)
        preferred_source = preferred_text if section in {"technical_skills", "programming_languages", "experience", "natural_languages"} else ""
        demands["preferred"][section] = _extract_section_items(section, preferred_source, alias_index)

    return demands


def _extract_evidence_from_cv(text: str, alias_index: Dict[str, str]) -> Dict[str, List[str]]:
    """Trích 'bằng chứng' của ứng viên theo từng section, để so với demands của JD."""
    sections = _split_sections(text, "summary")
    all_text = " ".join(sections.values())
    evidence = {}
    for section in SECTION_LABELS:
        section_text = sections.get(section, "")
        # Với section strict (kỹ năng, ngôn ngữ...), quét cả toàn văn để không bỏ sót.
        if section in STRICT_SECTIONS:
            section_text = f"{section_text} {all_text}"
        elif section == "experience":
            section_text = f"{section_text}\n{sections.get('summary', '')}"
        elif section == "responsibilities":
            # Trách nhiệm có thể nằm rải trong dự án/kinh nghiệm/tóm tắt.
            section_text = "\n".join(
                [
                    sections.get("responsibilities", ""),
                    sections.get("projects", ""),
                    sections.get("experience", ""),
                    sections.get("summary", ""),
                ]
            )
        evidence[section] = _extract_section_items(section, section_text, alias_index)
    return evidence
