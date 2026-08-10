"""Bộ so khớp và chấm điểm (scorer) — phần LÕI của toàn hệ thống.

Luồng chính khi bảo vệ đồ án nên nắm:
1. section_similarity: đo độ giống nhau giữa 2 đoạn text (kết hợp TF-IDF + embedding).
2. Các hàm *_item_match: kiểm tra 1 yêu cầu của JD có được CV đáp ứng không
   (theo 4 mức: khớp chính xác -> khớp từ khóa -> trùng token -> tương đồng ngữ nghĩa).
3. _section_result: chấm điểm 1 section.
4. score_cv_vs_jd: hàm tổng, gọi tất cả bước trên và trả kết quả cuối.

Đây là file HAY BỊ HỎI NHẤT vì chứa công thức tính điểm, hệ số phạt (penalty),
và cách kết hợp với hệ thống chấm điểm mới (CvScoringService).
"""

import json
import os
import re
from typing import Dict, List, Tuple

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    _HAVE_SKLEARN = True
except Exception:
    TfidfVectorizer = None
    cosine_similarity = None
    _HAVE_SKLEARN = False

from app.services.vectorizer import get_model
from app.services.matcher_config import (
    COMPATIBLE_SKILLS,
    DEFAULT_ALPHA_MAP,
    DEFAULT_WEIGHTS,
    NATURAL_LANGUAGES,
    PROGRAMMING_LANGUAGES,
    SECTION_LABELS,
    SKILL_HINTS,
    STRICT_SECTIONS,
)
from app.services.matcher_text import (
    _clamp_score,
    _dedupe,
    _humanize_item,
    _line_blocks,
    _score100,
)
from app.services.matcher_parser import parse_sections_cv, parse_sections_jd
from app.services.matcher_extractor import (
    _canonicalize_item,
    _extract_demands_from_jd,
    _extract_evidence_from_cv,
    _extract_known_terms,
    _load_alias_index,
    _required_experience_years,
    extract_experience_years,
    load_aliases,
    map_skills,
    regex_extract,
)


# ---------------------------------------------------------------------------
# 1. Đo độ tương đồng văn bản: TF-IDF (từ khóa) + embedding (ngữ nghĩa)
# ---------------------------------------------------------------------------
def _tfidf_cosine(a: str, b: str) -> float:
    """Độ tương đồng cosine theo TF-IDF. Nếu không có sklearn thì dùng Jaccard đơn giản."""
    if not _HAVE_SKLEARN:
        sa = set((a or "").lower().split())
        sb = set((b or "").lower().split())
        if not sa or not sb:
            return 0.0
        return float(len(sa.intersection(sb)) / len(sa.union(sb)))
    try:
        vect = TfidfVectorizer().fit_transform([a or "", b or ""]).toarray()
        sim = cosine_similarity([vect[0]], [vect[1]])
        return float(sim[0][0])
    except ValueError:
        return 0.0


def _embed_cosine(a: str, b: str) -> float:
    """Độ tương đồng theo embedding (ngữ nghĩa). Chỉ bật khi biến môi trường cho phép, ngược lại về TF-IDF."""
    if os.getenv("ENABLE_MATCHER_EMBEDDINGS") != "1":
        return _tfidf_cosine(a, b)
    try:
        model = get_model()
        vecs = model.encode([a or "", b or ""], convert_to_numpy=True)
        sim = cosine_similarity([vecs[0]], [vecs[1]])
        return float(sim[0][0])
    except Exception:
        return _tfidf_cosine(a, b)


def section_similarity(text_cv: str, text_jd: str, alpha: float = 0.75) -> float:
    """Điểm giống nhau giữa CV và JD = alpha*embedding + (1-alpha)*TF-IDF. alpha=0 nghĩa là chỉ dùng TF-IDF."""
    if not text_cv or not text_jd:
        return 0.0
    tfidf_sim = _tfidf_cosine(text_cv, text_jd)
    if alpha <= 0:
        return tfidf_sim
    embed_sim = _embed_cosine(text_cv, text_jd)
    return float(alpha * embed_sim + (1 - alpha) * tfidf_sim)


# ---------------------------------------------------------------------------
# 2. Các cách kiểm tra 1 yêu cầu (item) có được CV đáp ứng không
# ---------------------------------------------------------------------------
def _strict_item_match(required_item: str, evidence_items: List[str], alias_index: Dict[str, str]) -> bool:
    """Khớp CHÍNH XÁC: yêu cầu phải trùng đúng 1 mục trong CV (hoặc kỹ năng tương thích)."""
    required = _canonicalize_item(required_item, alias_index)
    evidence_set = {_canonicalize_item(item, alias_index) for item in evidence_items}
    if required in evidence_set:
        return True
    if COMPATIBLE_SKILLS.get(required, set()).intersection(evidence_set):
        return True
    pattern = r"(?<![a-z0-9+#.])" + re.escape(required) + r"(?![a-z0-9+#.])"
    return any(re.search(pattern, item) for item in evidence_set)


def _known_terms_in_item(text: str, alias_index: Dict[str, str]) -> List[str]:
    """Rút các từ khóa 'đã biết' (kỹ năng/ngôn ngữ) xuất hiện trong 1 mục."""
    terms = SKILL_HINTS | PROGRAMMING_LANGUAGES | NATURAL_LANGUAGES | set(alias_index.values())
    return _extract_known_terms(text, terms, alias_index)


def _keyword_item_match(required_item: str, evidence_items: List[str], alias_index: Dict[str, str]) -> bool:
    """Khớp theo TỪ KHÓA: so tập từ khóa của yêu cầu với từ khóa trong CV, cần đủ độ phủ."""
    required_terms = set(_known_terms_in_item(required_item, alias_index))
    if not required_terms:
        return False

    evidence_terms = set()
    for item in evidence_items:
        evidence_terms.update(_known_terms_in_item(item, alias_index))

    if not evidence_terms:
        return False

    overlap = required_terms.intersection(evidence_terms)
    coverage = len(overlap) / len(required_terms)
    # Yêu cầu ngắn (<=2 từ khóa) phải khớp 100%; yêu cầu dài chỉ cần phủ 60%.
    if len(required_terms) <= 2:
        return coverage >= 1.0
    return coverage >= 0.6


def _semantic_item_match(required_item: str, evidence_items: List[str], alpha: float) -> bool:
    """Khớp theo NGỮ NGHĨA: có mục nào trong CV đạt độ tương đồng >= 0.35 với yêu cầu không."""
    if not required_item or not evidence_items:
        return False
    return max((section_similarity(item, required_item, alpha=alpha) for item in evidence_items), default=0.0) >= 0.35


def _stem_for_overlap(token: str) -> str:
    """Cắt hậu tố đơn giản (ing/ed/s) để 'testing' và 'test' được coi là cùng gốc."""
    token = re.sub(r"[^a-z0-9+#.]", "", token.lower())
    for suffix in ("ing", "ed", "s"):
        if len(token) > len(suffix) + 3 and token.endswith(suffix):
            return token[: -len(suffix)]
    return token


def _token_overlap_item_match(required_item: str, evidence_items: List[str]) -> bool:
    """Khớp theo TRÙNG TOKEN: so các từ gốc (đã bỏ stopword) giữa yêu cầu và bằng chứng."""
    stopwords = {
        "and",
        "or",
        "the",
        "a",
        "an",
        "with",
        "for",
        "to",
        "of",
        "in",
        "on",
        "as",
        "role",
        "experience",
        "required",
        "requirement",
    }
    required_tokens = {
        _stem_for_overlap(token)
        for token in re.findall(r"[a-z0-9+#.]+", required_item.lower())
        if token.lower() not in stopwords and len(token) > 2
    }
    if not required_tokens:
        return False

    for item in evidence_items:
        evidence_tokens = {
            _stem_for_overlap(token)
            for token in re.findall(r"[a-z0-9+#.]+", item.lower())
            if token.lower() not in stopwords and len(token) > 2
        }
        if not evidence_tokens:
            continue
        coverage = len(required_tokens.intersection(evidence_tokens)) / len(required_tokens)
        if coverage >= (0.5 if len(required_tokens) <= 3 else 0.4):
            return True
    return False


# ---------------------------------------------------------------------------
# 3. Chấm điểm cho từng section
# ---------------------------------------------------------------------------
def _section_explanation(label: str, good: List[str], missing: List[str]) -> str:
    """Sinh câu giải thích ngắn cho 1 section dựa trên số mục đạt/thiếu."""
    if good and missing:
        return f"Candidate has relevant {label.lower()} evidence but still misses some JD demands."
    if good:
        return f"Candidate satisfies the detected {label.lower()} demands."
    if missing:
        return f"Candidate is missing detected {label.lower()} demands from the JD."
    return ""


def _section_result(
    section: str,
    required_items: List[str],
    preferred_items: List[str],
    evidence_items: List[str],
    weight: float,
    alpha: float,
    alias_index: Dict[str, str],
) -> Dict:
    """Chấm điểm 1 section: đếm số yêu cầu đạt (mục bắt buộc tính đủ, mục ưu tiên tính 0.25)."""
    good = []
    missing = []
    matched_required = 0.0
    matched_preferred = 0.0

    # Với 'experience', yêu cầu về SỐ NĂM được xử lý riêng (không khớp ngữ nghĩa).
    semantic_required_items = required_items
    experience_year_required = section == "experience" and _required_experience_years(" ".join(required_items)) > 0
    if section == "experience":
        semantic_required_items = [item for item in required_items if _required_experience_years(item) == 0]

    required_total = len(semantic_required_items)
    preferred_total = len(preferred_items)
    if experience_year_required:
        required_total += 1
    preferred_weight = 0.25
    denominator = (required_total * 1.0) + (preferred_total * preferred_weight)
    # Không có yêu cầu nào -> section không áp dụng, bỏ qua khi tính tổng.
    if denominator == 0:
        return {
            "key": section,
            "label": SECTION_LABELS[section],
            "score": None,
            "weight": weight,
            "applicable": False,
            "good": [],
            "missing": [],
            "explanation": "",
        }

    # Duyệt từng yêu cầu bắt buộc, thử lần lượt 4 kiểu khớp (strict cho section chặt, còn lại nới dần).
    for item in semantic_required_items:
        matched = (
            _strict_item_match(item, evidence_items, alias_index)
            if section in STRICT_SECTIONS
            else (
                _keyword_item_match(item, evidence_items, alias_index)
                or _token_overlap_item_match(item, evidence_items)
                or _semantic_item_match(item, evidence_items, alpha)
            )
        )
        if matched:
            matched_required += 1
            good.append(f"{_humanize_item(item)} matched")
        else:
            missing.append(f"{_humanize_item(item)} missing")

    # Yêu cầu ưu tiên: khớp thì cộng điểm nhẹ, thiếu cũng không phạt nặng.
    for item in preferred_items:
        matched = (
            _strict_item_match(item, evidence_items, alias_index)
            if section in STRICT_SECTIONS
            else (
                _keyword_item_match(item, evidence_items, alias_index)
                or _token_overlap_item_match(item, evidence_items)
                or _semantic_item_match(item, evidence_items, alpha)
            )
        )
        if matched:
            matched_preferred += 1
            good.append(f"Preferred {_humanize_item(item)} matched")
        else:
            missing.append(f"Preferred {_humanize_item(item)} missing")

    # Xử lý riêng điều kiện số năm kinh nghiệm: đủ thì +1, thiếu thì cho điểm một phần.
    if section == "experience":
        required_years = _required_experience_years(" ".join(required_items))
        candidate_years = extract_experience_years(" ".join(evidence_items))
        if required_years > 0:
            if candidate_years >= required_years:
                matched_required += 1
                good.append(f"{candidate_years:g} years experience found")
            elif candidate_years > 0:
                partial_credit = min(0.85, candidate_years / required_years)
                matched_required += partial_credit
                good.append(f"{candidate_years:g} years partial experience found")
                missing.append(f"{required_years:g}+ years experience required")
            else:
                missing.append(f"{required_years:g}+ years experience required")

    score = ((matched_required * 1.0) + (matched_preferred * preferred_weight)) / denominator

    score100 = _score100(score)
    good = _dedupe(good)
    missing = _dedupe(missing)
    return {
        "key": section,
        "label": SECTION_LABELS[section],
        "score": score100,
        "weight": weight,
        "applicable": True,
        "good": good,
        "missing": missing,
        "explanation": _section_explanation(SECTION_LABELS[section], good, missing),
    }


def rule_based_checks(parsed_cv: Dict[str, str], parsed_jd: Dict[str, str], extra: Dict) -> Tuple[List[str], List[str]]:
    """Kiểm tra cứng theo luật: ngôn ngữ bắt buộc và số năm kinh nghiệm tối thiểu (pass/fail)."""
    passes = []
    fails = []
    jd_langs = parsed_jd.get("language_requirement", "")
    if jd_langs:
        cv_langs = parsed_cv.get("languages", "")
        matched = False
        for lang in sorted(NATURAL_LANGUAGES):
            if lang in jd_langs.lower() and lang in cv_langs.lower():
                matched = True
                passes.append(f"language:{lang}")
        if not matched:
            fails.append("missing_required_language")

    required_years = _required_experience_years(parsed_jd.get("required_experience", ""))
    candidate_years = extract_experience_years(parsed_cv.get("experience", "") or parsed_cv.get("skills", ""))
    if required_years > 0:
        if candidate_years >= required_years:
            passes.append(f"experience_years:{candidate_years:.2f}")
        else:
            fails.append(f"insufficient_experience:{candidate_years:.2f}<{required_years:.2f}")
    return passes, fails


# ---------------------------------------------------------------------------
# 4. Chuẩn hóa trọng số và tính điểm tổng
# ---------------------------------------------------------------------------
def _normalize_weights(weights: Dict[str, float] | None) -> Dict[str, float]:
    """Chuẩn hóa trọng số về tổng = 1. Nếu không hợp lệ thì dùng DEFAULT_WEIGHTS."""
    source = weights or DEFAULT_WEIGHTS
    usable = {section: max(0.0, float(source.get(section, 0.0))) for section in DEFAULT_WEIGHTS}
    total = sum(usable.values())
    if total <= 0:
        return DEFAULT_WEIGHTS.copy()
    return {section: value / total for section, value in usable.items()}


def _infer_must_have(demands: Dict[str, Dict[str, List[str]]]) -> List[str]:
    """Suy ra danh sách kỹ năng 'bắt buộc phải có' (lấy tối đa 3 mục đầu của các section cốt lõi)."""
    must_have = []
    for section in ("technical_skills", "programming_languages", "experience", "natural_languages"):
        must_have.extend(demands["required"].get(section, [])[:3])
    return _dedupe(must_have)


def _core_fit_score(section_scores: Dict[str, float | None]) -> float | None:
    """Điểm 'độ phù hợp cốt lõi' — chỉ dựa trên 4 section quan trọng nhất, có trọng số riêng."""
    core_weights = {
        "technical_skills": 0.45,
        "programming_languages": 0.20,
        "experience": 0.25,
        "natural_languages": 0.10,
    }
    applicable = {
        section: weight
        for section, weight in core_weights.items()
        if isinstance(section_scores.get(section), (int, float))
    }
    total = sum(applicable.values())
    if total <= 0:
        return None
    return sum(float(section_scores[section]) * weight for section, weight in applicable.items()) / total


def score_cv_vs_jd(
    cv_text: str,
    jd_text: str,
    weights: Dict[str, float] = None,
    alpha: float = 0.7,
    alpha_map: Dict[str, float] = None,
    must_have: List[str] | None = None,
) -> Dict:
    """Hàm TỔNG: chấm điểm 1 CV so với 1 JD, trả về điểm tổng + chi tiết từng section.

    Các bước: chuẩn bị alias/trọng số -> tách section -> trích demands & evidence ->
    chấm điểm từng section -> tính điểm tổng (có hiệu chỉnh) -> áp hệ số phạt must-have ->
    gọi thêm hệ thống chấm điểm hybrid mới (CvScoringService) để bổ sung 7 tiêu chí.
    """
    aliases = load_aliases()
    alias_index = _load_alias_index(aliases)
    normalized_weights = _normalize_weights(weights)
    effective_alpha_map = {**DEFAULT_ALPHA_MAP, **(alpha_map or {})}

    parsed_cv = parse_sections_cv(cv_text)
    parsed_jd = parse_sections_jd(jd_text)
    regex_cv = regex_extract(cv_text)
    regex_jd = regex_extract(jd_text)
    demands = _extract_demands_from_jd(jd_text, alias_index)
    evidence = _extract_evidence_from_cv(cv_text, alias_index)

    sections = []
    section_scores = {}
    good_points = []
    missing_points = []

    # Chấm điểm lần lượt từng section theo DEFAULT_WEIGHTS.
    for section in DEFAULT_WEIGHTS:
        result = _section_result(
            section=section,
            required_items=demands["required"].get(section, []),
            preferred_items=demands["preferred"].get(section, []),
            evidence_items=evidence.get(section, []),
            weight=round(normalized_weights[section], 4),
            alpha=effective_alpha_map.get(section, alpha),
            alias_index=alias_index,
        )
        section_scores[section] = result["score"]
        if result["score"] or result["good"] or result["missing"] or result["explanation"]:
            sections.append(result)
            good_points.extend(result["good"])
            missing_points.extend(result["missing"])

    # Điểm tổng = trung bình có trọng số, chỉ tính trên các section áp dụng được.
    applicable_sections = [
        section
        for section in DEFAULT_WEIGHTS
        if isinstance(section_scores.get(section), (int, float))
    ]
    applicable_weight = sum(normalized_weights[section] for section in applicable_sections)
    if applicable_weight > 0:
        raw_score = sum(
            section_scores[section] * normalized_weights[section]
            for section in applicable_sections
        ) / applicable_weight
    else:
        raw_score = 0.0
    # Hiệu chỉnh: kéo điểm về phía 'độ phù hợp cốt lõi' để kỹ năng lõi có ảnh hưởng lớn hơn.
    core_score = _core_fit_score(section_scores)
    calibrated_score = raw_score
    if core_score is not None:
        calibrated_score = max(raw_score, (raw_score * 0.35) + (core_score * 0.65))

    # Kiểm tra các kỹ năng must-have; thiếu càng nhiều thì phạt điểm càng cao (tối đa 15).
    must_have_items = must_have if must_have is not None else _infer_must_have(demands)
    must_have_matched = []
    must_have_missing = []
    all_evidence_items = [item for items in evidence.values() for item in items]
    for item in must_have_items:
        canonical = _canonicalize_item(item, alias_index)
        required_years = _required_experience_years(canonical)
        candidate_years = extract_experience_years(" ".join(evidence.get("experience", [])))
        if required_years > 0 and candidate_years >= required_years:
            must_have_matched.append(_humanize_item(canonical))
        elif (
            _strict_item_match(canonical, all_evidence_items, alias_index)
            or _keyword_item_match(canonical, all_evidence_items, alias_index)
            or _semantic_item_match(canonical, all_evidence_items, 0.25)
        ):
            must_have_matched.append(_humanize_item(canonical))
        else:
            must_have_missing.append(_humanize_item(canonical))

    must_have_total = len(must_have_matched) + len(must_have_missing)
    if must_have_total == 0:
        penalty = 0.0
    else:
        missing_rate = len(must_have_missing) / must_have_total
        penalty = min(15.0, missing_rate * 15.0)
        # Nếu số đạt >= số thiếu thì giảm nửa mức phạt.
        if len(must_have_matched) >= len(must_have_missing):
            penalty *= 0.5
    penalty = round(penalty, 3)
    orig_final_score = round(_clamp_score(calibrated_score - penalty), 3)

    passes, fails = rule_based_checks(parsed_cv, parsed_jd, {})
    for missing in must_have_missing:
        fails.append(f"missing_must_have:{missing}")

    good_points = _dedupe(good_points)
    missing_points = _dedupe(missing_points)
    summary = {
        "good_count": len(good_points),
        "missing_count": len(missing_points),
        "must_have_matched_count": len(must_have_matched),
        "must_have_missing_count": len(must_have_missing),
    }

    # Gọi thêm hệ thống chấm điểm hybrid mới (7 tiêu chí) để làm điểm cuối hiển thị cho recruiter.
    from app.services.cv_scoring import CvScoringService
    scoring_service = CvScoringService()
    scoring_result = scoring_service.score_cv_vs_jd(cv_text, jd_text, custom_weights=weights)

    final_score = scoring_result["finalScore"]
    sub_scores = scoring_result["subScores"]
    matched = scoring_result["matched"]
    missing_or_weak = scoring_result["missingOrWeak"]
    reasoning_summary = scoring_result["reasoningSummary"]

    # Đóng gói 7 tiêu chí mới thành các block section để UI hiển thị đồng nhất.
    new_sections = [
        {
            "key": "required_skills",
            "label": "Required Skills Match",
            "score": sub_scores["required_skills"],
            "good": matched["required_skills"],
            "missing": missing_or_weak["required_skills"],
            "explanation": reasoning_summary
        },
        {
            "key": "project_domain",
            "label": "Project / Domain Relevance",
            "score": sub_scores["project_domain"],
            "good": matched["project_domain"],
            "missing": missing_or_weak["project_domain"],
            "explanation": reasoning_summary
        },
        {
            "key": "seniority",
            "label": "Years of Experience / Seniority",
            "score": sub_scores["seniority"],
            "good": matched["seniority"],
            "missing": missing_or_weak["seniority"],
            "explanation": reasoning_summary
        },
        {
            "key": "responsibility",
            "label": "Responsibility Match",
            "score": sub_scores["responsibility"],
            "good": matched["responsibility"],
            "missing": missing_or_weak["responsibility"],
            "explanation": reasoning_summary
        },
        {
            "key": "testing_documentation",
            "label": "Testing / Documentation / Quality Evidence",
            "score": sub_scores["testing_documentation"],
            "good": matched["testing_documentation"],
            "missing": missing_or_weak["testing_documentation"],
            "explanation": reasoning_summary
        },
        {
            "key": "language_collaboration",
            "label": "Language / Collaboration",
            "score": sub_scores["language_collaboration"],
            "good": matched["language_collaboration"],
            "missing": missing_or_weak["language_collaboration"],
            "explanation": reasoning_summary
        },
        {
            "key": "bonus_skills",
            "label": "Bonus Skills",
            "score": sub_scores["bonus_skills"],
            "good": matched["bonus_skills"],
            "missing": missing_or_weak["bonus_skills"],
            "explanation": reasoning_summary
        }
    ]

    return {
        "overall_score": orig_final_score,
        "final_score": orig_final_score,
        "finalScore": final_score,
        "subScores": sub_scores,
        "matched": matched,
        "missingOrWeak": missing_or_weak,
        "reasoningSummary": reasoning_summary,
        "summary": summary,
        "raw_score": raw_score,
        "core_fit_score": core_score,
        "calibrated_score": calibrated_score,
        "sections": new_sections + sections,
        "good_points": good_points,
        "missing_points": missing_points,
        "must_have": {
            "matched": must_have_matched,
            "missing": must_have_missing,
            "penalty_applied": penalty,
        },
        "parsed_cv": parsed_cv,
        "parsed_jd": parsed_jd,
        "regex_cv": regex_cv,
        "regex_jd": regex_jd,
        "mapped_skills": map_skills(parsed_cv.get("skills", ""), aliases),
        "section_scores": {**section_scores, **sub_scores},
        "passes": passes,
        "fails": fails,
        "alpha_map": effective_alpha_map,
        "score_scale": "0-100",
    }


if __name__ == "__main__":
    # Chạy thử nhanh với 1 cặp CV/JD mẫu để kiểm tra hàm chấm điểm.
    sample_cv = """
    John Doe
    Skills: Python, Django, PostgreSQL
    Experience: 5 years building backend APIs
    Projects: e-commerce REST API
    Languages: English
    """
    sample_jd = """
    Backend Engineer
    Requirements: Python, Django, Docker, 3+ years experience
    Language: English
    Preferred: Kubernetes
    Responsibilities: Build REST APIs
    """
    out = score_cv_vs_jd(sample_cv, sample_jd)
    print(json.dumps(out, indent=2, ensure_ascii=False))
