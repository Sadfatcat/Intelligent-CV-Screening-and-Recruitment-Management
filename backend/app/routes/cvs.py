import json
import logging
import os
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from typing import Optional

from app.database import engine, get_session
from app.models import ActivityLog, CV, Job, JobApplication, User

logger = logging.getLogger(__name__)

# prefix /api/cvs, tất cả route trong file này đều bắt đầu bằng /api/cvs/...
router = APIRouter(prefix="/api/cvs", tags=["cvs"])

# thư mục lưu file cv trên server
UPLOAD_DIR = os.getenv("CV_UPLOAD_DIR", "/app/uploads/cv")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# các định dạng file được chấp nhận
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
ENABLE_UPLOAD_VECTORS = os.getenv("ENABLE_UPLOAD_VECTORS", "0") == "1"


def score_application_background(application_id: int, cv_id: int, job_id: int, file_path: str, filename: str):
    parsed_text = None
    cv_vector_json = None
    matching_score = None
    matching_detail_json = None

    try:
        with open(file_path, "rb") as stored_file:
            file_bytes = stored_file.read()

        from app.services.extractor import extract_text
        parsed_text = extract_text(file_bytes, filename)

        if ENABLE_UPLOAD_VECTORS:
            try:
                from app.services.vectorizer import text_to_vector_json
                cv_vector_json = text_to_vector_json(parsed_text) if parsed_text else None
            except Exception:
                cv_vector_json = None

        with Session(engine) as session:
            job = session.get(Job, job_id)
            if parsed_text and job and job.jd_parsed_text:
                try:
                    import json
                    from app.services.matching_config import parse_matching_config
                    from app.services.matcher import score_cv_vs_jd

                    config = parse_matching_config(job.matching_config, strict=False)
                    matching_detail = score_cv_vs_jd(
                        parsed_text,
                        job.jd_parsed_text,
                        weights=config.get("weights"),
                        must_have=config.get("must_have"),
                    )
                    matching_score = matching_detail.get("final_score")
                    matching_detail["overall_score"] = matching_score
                    matching_detail["final_score"] = matching_score
                    matching_detail_json = json.dumps(matching_detail, ensure_ascii=False)
                except Exception as exc:
                    logger.exception("Detailed CV/JD matcher failed for job_id=%s: %s", job_id, exc)

            if matching_score is None and job and job.jd_vector and cv_vector_json:
                try:
                    from app.services.ai_service import calculate_match_score_from_vectors

                    matching_score = calculate_match_score_from_vectors(cv_vector_json, job.jd_vector)
                except Exception:
                    matching_score = None

            cv = session.get(CV, cv_id)
            application = session.get(JobApplication, application_id)
            if cv:
                cv.parsed_text = parsed_text
                cv.cv_vector = cv_vector_json
                session.add(cv)
            if application:
                application.ai_matching_score = matching_score
                application.matching_detail = matching_detail_json
                application.status = "pending"
                session.add(application)
            session.commit()
    except Exception as exc:
        logger.exception("CV scoring background task failed for application_id=%s: %s", application_id, exc)
        with Session(engine) as session:
            application = session.get(JobApplication, application_id)
            if application:
                application.status = "pending"
                session.add(application)
                session.commit()


@router.post("/upload-cv")
async def upload_cv(
    background_tasks: BackgroundTasks,
    job_id: int = Form(...),
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    candidate_phone: str = Form(...),
    candidate_id: Optional[int] = Form(default=None),  # none nếu chưa có tài khoản
    cv_file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    # localStorage có thể giữ candidate_id cũ sau khi reset DB; fallback về guest thay vì crash 500
    if candidate_id is not None:
        candidate = session.get(User, candidate_id)
        if not candidate or candidate.role != "candidate":
            candidate_id = None

    # kiểm tra job có tồn tại không
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job id={job_id} not found")
    if job.status != "active":
        raise HTTPException(status_code=400, detail="This job is not accepting CV submissions")

    # kiểm tra định dạng file
    ext = os.path.splitext(cv_file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Accepted formats: PDF, DOCX, JPG, PNG")

    file_bytes = await cv_file.read()

    # lưu cv vào ổ cứng, đặt tên bằng uuid để tránh trùng
    safe_name = f"{uuid.uuid4()}_{cv_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    new_cv = CV(
        candidate_id=candidate_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        candidate_phone=candidate_phone,
        file_path=file_path,
        parsed_text=None,
        cv_vector=None,
    )
    session.add(new_cv)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Candidate information is invalid. Please login again and retry.")
    session.refresh(new_cv)

    # tạo đơn ứng tuyển, liên kết cv này với job
    application = JobApplication(
        job_id=job_id,
        cv_id=new_cv.id,
        status="scoring",
        ai_matching_score=None,
        matching_detail=None,
    )
    session.add(application)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Cannot create application for this CV/job pair.")
    session.refresh(application)

    session.add(
        ActivityLog(
            actor_user_id=candidate_id,
            actor_role="candidate" if candidate_id else "guest",
            action="candidate.cv.submit",
            target_type="application",
            target_id=application.id,
            detail=f"Submitted CV to job id={job_id}",
        )
    )
    try:
        session.commit()
    except IntegrityError:
        session.rollback()

    background_tasks.add_task(
        score_application_background,
        application.id,
        new_cv.id,
        job_id,
        file_path,
        cv_file.filename,
    )

    return {
        "message": "Application submitted successfully. Scoring is in progress.",
        "cv_id": new_cv.id,
        "application_id": application.id,
        "job_title": job.title,
        "status": application.status,
        "vector_saved": False,
        "matching_score": None,
        "matching_detail": None,
    }


@router.get("/job/{job_id}")
def list_cvs_for_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    applications = session.exec(
        select(JobApplication).where(JobApplication.job_id == job_id)
    ).all()

    result = []
    for app in applications:
        cv = session.get(CV, app.cv_id)
        if cv:
            result.append({
                "application_id": app.id,
                "status": app.status,
                "ai_matching_score": app.ai_matching_score,
                "candidate_name": cv.candidate_name,
                "candidate_email": cv.candidate_email,
                "candidate_phone": cv.candidate_phone,
                "cv_id": cv.id,
                "has_text": cv.parsed_text is not None,
                "has_vector": cv.cv_vector is not None,
            })

    return {"job_title": job.title, "total": len(result), "applications": result}


@router.get("/candidate/{candidate_id}/applications")
def list_candidate_applications(candidate_id: int, session: Session = Depends(get_session)):
    candidate = session.get(User, candidate_id)
    if not candidate or candidate.role != "candidate":
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate_email = (candidate.email or "").strip().lower()
    cvs = session.exec(
        select(CV).where(
            or_(
                CV.candidate_id == candidate_id,
                func.lower(CV.candidate_email) == candidate_email,
            )
        )
    ).all()
    cv_ids = [cv.id for cv in cvs if cv.id is not None]
    if not cv_ids:
        return {"candidate_id": candidate_id, "total": 0, "applications": []}

    applications = session.exec(
        select(JobApplication)
        .where(JobApplication.cv_id.in_(cv_ids))
        .order_by(JobApplication.id.desc())
    ).all()

    result = []
    for app in applications:
        if not app.job_id:
            continue

        job = session.get(Job, app.job_id)
        if not job:
            continue

        matching_detail = None
        if app.matching_detail:
            try:
                matching_detail = json.loads(app.matching_detail)
            except json.JSONDecodeError:
                matching_detail = None

        submit_log = session.exec(
            select(ActivityLog)
            .where(
                ActivityLog.action == "candidate.cv.submit",
                ActivityLog.target_type == "application",
                ActivityLog.target_id == app.id,
            )
            .order_by(ActivityLog.created_at.desc())
        ).first()

        result.append(
            {
                "application_id": app.id,
                "job_id": job.id,
                "job_title": job.title,
                "company_name": job.company_name,
                "location": job.location,
                "level": job.level,
                "deadline": job.deadline,
                "quantity": job.quantity,
                "salary": job.salary,
                "direct_contact": job.direct_contact,
                "image_url": job.image_url,
                "description": job.description,
                "status": app.status,
                "ai_matching_score": app.ai_matching_score,
                "matching_detail": matching_detail,
                "submitted_at": submit_log.created_at if submit_log else None,
            }
        )

    return {"candidate_id": candidate_id, "total": len(result), "applications": result}
