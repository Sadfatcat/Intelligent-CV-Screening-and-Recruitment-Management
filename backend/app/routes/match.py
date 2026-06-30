from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.extractor import extract_text
from app.services.cv_scoring import CvScoringService

# This route now uses the criteria-based hybrid scoring engine from app.services.cv_scoring.
router = APIRouter(prefix="/match", tags=["match"])


def _build_backward_compatible_response(result: dict, cv_text: str, jd_text: str) -> dict:
    from app.services.matcher import (
        load_aliases,
        parse_sections_cv,
        parse_sections_jd,
        regex_extract,
        rule_based_checks,
        map_skills,
    )
    
    aliases = load_aliases()
    parsed_cv = parse_sections_cv(cv_text)
    parsed_jd = parse_sections_jd(jd_text)
    regex_cv = regex_extract(cv_text)
    regex_jd = regex_extract(jd_text)
    
    passes, fails = rule_based_checks(parsed_cv, parsed_jd, {})
    
    sub_scores = result.get("subScores", {})
    section_scores = {k: round(v / 100.0, 4) for k, v in sub_scores.items()}
    
    good_points = []
    for items in result.get("matched", {}).values():
        good_points.extend(items)
    missing_points = []
    for items in result.get("missingOrWeak", {}).values():
        missing_points.extend(items)
        
    must_have_matched = result.get("matched", {}).get("required_skills", [])
    must_have_missing = result.get("missingOrWeak", {}).get("required_skills", [])
    
    sections = []
    for key, val in sub_scores.items():
        sections.append({
            "key": key,
            "label": key.replace("_", " ").title(),
            "score": val,
            "good": result.get("matched", {}).get(key, []),
            "missing": result.get("missingOrWeak", {}).get(key, []),
            "explanation": result.get("reasoningSummary", "")
        })
        
    return {
        "finalScore": result.get("finalScore", 0.0),
        "final_score": round(result.get("finalScore", 0.0) / 100.0, 4),
        "subScores": sub_scores,
        "section_scores": section_scores,
        "matched": result.get("matched", {}),
        "missingOrWeak": result.get("missingOrWeak", {}),
        "reasoningSummary": result.get("reasoningSummary", ""),
        "scoringEngine": "criteria_based_v2",
        "sections": sections,
        "good_points": list(set(good_points)),
        "missing_points": list(set(missing_points)),
        "must_have": {
            "matched": must_have_matched,
            "missing": must_have_missing,
            "penalty_applied": 0.0,
        },
        "parsed_cv": parsed_cv,
        "parsed_jd": parsed_jd,
        "regex_cv": regex_cv,
        "regex_jd": regex_jd,
        "mapped_skills": map_skills(parsed_cv.get("skills", ""), aliases),
        "passes": passes,
        "fails": fails,
    }


def _score_with_new_engine(cv_text: str, jd_text: str, alpha: float = 0.7) -> dict:
    scoring_service = CvScoringService(alpha=alpha)
    result = scoring_service.score_cv_vs_jd(cv_text=cv_text, jd_text=jd_text)
    return _build_backward_compatible_response(result, cv_text, jd_text)


@router.post("/cv_vs_jd")
async def match_cv_vs_jd(
    file: UploadFile = File(..., description="Upload CV file (PDF, DOCX, or image)"),
    jd_text: str = Form(..., description="Job Description text"),
    alpha: float = Form(0.7, description="Global alpha (embedding vs TF-IDF weight)"),
):
    """
    Match a CV file against a Job Description using the new criteria-based hybrid scoring engine.
    """
    try:
        content = await file.read()
        cv_text = extract_text(content, file.filename or "cv")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract CV text: {str(e)}")

    try:
        result = _score_with_new_engine(cv_text, jd_text, alpha=alpha)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")


@router.post("/cv_vs_jd_text")
async def match_cv_vs_jd_text(
    cv_text: str = Form(..., description="CV text content"),
    jd_text: str = Form(..., description="Job Description text"),
    alpha: float = Form(0.7, description="Global alpha (embedding vs TF-IDF weight)"),
):
    """
    Match CV text directly against Job Description text using the new criteria-based hybrid scoring engine.
    """
    try:
        result = _score_with_new_engine(cv_text, jd_text, alpha=alpha)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")
