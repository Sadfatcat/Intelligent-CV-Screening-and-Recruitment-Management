from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.extractor import extract_text
from app.services.matcher import score_cv_vs_jd

router = APIRouter(prefix="/match", tags=["match"])


@router.post("/cv_vs_jd")
async def match_cv_vs_jd(
    file: UploadFile = File(..., description="Upload CV file (PDF, DOCX, or image)"),
    jd_text: str = Form(..., description="Job Description text"),
    alpha: float = Form(0.7, description="Global alpha (embedding vs TF-IDF weight)"),
):
    """
    Match a CV file against a Job Description.

    Returns:
    - parsed_cv: parsed sections from CV
    - parsed_jd: parsed sections from JD
    - regex_cv: extracted regex patterns from CV (emails, phones, languages, years)
    - regex_jd: extracted regex patterns from JD
    - mapped_skills: skills from CV after alias normalization
    - section_scores: per-section similarity scores
    - passes: list of rule-based passes (e.g., "language:english")
    - fails: list of rule-based fails (e.g., "missing_required_language")
    - final_score: weighted aggregate match score (0.0 to 1.0)
    - alpha_map: per-section alpha values used
    """
    try:
        # Extract text from uploaded file
        content = await file.read()
        cv_text = extract_text(content, file.filename or "cv")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract CV text: {str(e)}")

    try:
        # Score CV vs JD
        result = score_cv_vs_jd(cv_text, jd_text, alpha=alpha)
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
    Match CV text directly against Job Description text (without file upload).

    Useful for testing without files or when CV/JD are already in text form.
    """
    try:
        result = score_cv_vs_jd(cv_text, jd_text, alpha=alpha)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")
