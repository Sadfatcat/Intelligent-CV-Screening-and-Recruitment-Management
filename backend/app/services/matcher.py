"""Điểm vào (façade) của bộ so khớp CV-JD.

File này ĐÃ ĐƯỢC TÁCH thành các module nhỏ để dễ tìm, dễ sửa:
- matcher_config.py    : dữ liệu tĩnh (trọng số, danh sách kỹ năng, bản đồ tiêu đề).
- matcher_text.py      : hàm tiện ích xử lý chuỗi.
- matcher_parser.py    : tách CV/JD thành các section.
- matcher_extractor.py : trích xuất kỹ năng, số năm kinh nghiệm, demands & evidence.
- matcher_scorer.py    : so khớp và tính điểm (phần lõi).

Ở đây chỉ re-export lại toàn bộ tên cũ, nên mọi câu lệnh
`from app.services.matcher import ...` ở nơi khác vẫn chạy y như trước.
"""

from app.services.matcher_config import (  # noqa: F401
    ALIAS_PATH,
    BASE_DIR,
    CERTIFICATE_HINTS,
    COMPATIBLE_SKILLS,
    DEFAULT_ALPHA_MAP,
    DEFAULT_WEIGHTS,
    HEADING_PHRASE_MAP,
    INTERNAL_SECTION_KEYS,
    NATURAL_LANGUAGES,
    PROGRAMMING_LANGUAGES,
    SECTION_LABELS,
    SECTION_SYNONYMS,
    SKILL_HINTS,
    STRICT_SECTIONS,
)
from app.services.matcher_text import (  # noqa: F401
    _clamp_score,
    _dedupe,
    _humanize_item,
    _line_blocks,
    _list_blocks,
    _normalize_token,
    _score100,
    clean_text,
)
from app.services.matcher_parser import (  # noqa: F401
    _section_for_heading,
    _split_sections,
    parse_sections_cv,
    parse_sections_jd,
)
from app.services.matcher_extractor import (  # noqa: F401
    _canonicalize_item,
    _extract_demands_from_jd,
    _extract_evidence_from_cv,
    _extract_known_terms,
    _extract_list_items,
    _extract_month_values,
    _extract_section_items,
    _extract_year_values,
    _load_alias_index,
    _required_experience_years,
    extract_experience_years,
    load_aliases,
    map_skills,
    regex_extract,
)
from app.services.matcher_scorer import (  # noqa: F401
    _core_fit_score,
    _embed_cosine,
    _infer_must_have,
    _keyword_item_match,
    _known_terms_in_item,
    _normalize_weights,
    _section_explanation,
    _section_result,
    _semantic_item_match,
    _stem_for_overlap,
    _strict_item_match,
    _tfidf_cosine,
    _token_overlap_item_match,
    rule_based_checks,
    score_cv_vs_jd,
    section_similarity,
)

# BASE_DIR được định nghĩa lại trỏ về file này để tương thích code cũ nếu có tham chiếu.
import os

BASE_DIR = os.path.dirname(__file__)


if __name__ == "__main__":
    from app.services.matcher_scorer import score_cv_vs_jd as _run

    sample_cv = "Skills: Python, Django\nExperience: 5 years"
    sample_jd = "Requirements: Python, 3+ years experience"
    import json

    print(json.dumps(_run(sample_cv, sample_jd), indent=2, ensure_ascii=False))
