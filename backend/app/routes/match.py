from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.extractor import extract_text
from app.services.cv_scoring import CvScoringService

router = APIRouter(prefix="/match", tags=["match"])


def _build_scoring_response(result: dict) -> dict:
    final_score_100 = float(result.get("finalScore", 0))
    sub_scores_100 = result.get("subScores", {})

    return {
        **result,
        "finalScore": final_score_100,
        "final_score": round(final_score_100 / 100, 4),
        "subScores": sub_scores_100,
        "section_scores": {
            key: round(float(value) / 100, 4)
            for key, value in sub_scores_100.items()
        },
        "scoringEngine": "criteria_based_v2"
    }


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
        scoring_service = CvScoringService()
        result = scoring_service.score_cv_vs_jd(cv_text=cv_text, jd_text=jd_text)
        return _build_scoring_response(result)
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
        scoring_service = CvScoringService()
        result = scoring_service.score_cv_vs_jd(cv_text=cv_text, jd_text=jd_text)
        return _build_scoring_response(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")
