import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import Optional

from app.database import get_session
from app.models import ActivityLog, CV, Job, JobApplication

# prefix /api/cvs, tất cả route trong file này đều bắt đầu bằng /api/cvs/...
router = APIRouter(prefix="/api/cvs", tags=["cvs"])

# thư mục lưu file cv trên server
UPLOAD_DIR = "/app/uploads/cv"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# các định dạng file được chấp nhận
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}


@router.post("/upload-cv")
async def upload_cv(
    job_id: int = Form(...),
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    candidate_phone: str = Form(...),
    candidate_id: Optional[int] = Form(default=None),  # none nếu chưa có tài khoản
    cv_file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    # kiểm tra job có tồn tại không
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy job id={job_id}")

    # kiểm tra định dạng file
    ext = os.path.splitext(cv_file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Không nhận file '{ext}', chỉ nhận: PDF, DOCX, JPG, PNG")

    file_bytes = await cv_file.read()

    # lưu cv vào ổ cứng, đặt tên bằng uuid để tránh trùng
    safe_name = f"{uuid.uuid4()}_{cv_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # đọc text từ cv (pdf/docx/ảnh) - lazy import để tránh sập app do thiếu dependency
    try:
        from app.services.extractor import extract_text
        parsed_text = extract_text(file_bytes, cv_file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Không đọc được CV: {str(e)}")

    # lưu vector cv, nếu lỗi thì để None, không ảnh hưởng phần còn lại
    try:
        from app.services.vectorizer import text_to_vector_json
        cv_vector_json = text_to_vector_json(parsed_text) if parsed_text else None
    except Exception:
        cv_vector_json = None

    new_cv = CV(
        candidate_id=candidate_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        candidate_phone=candidate_phone,
        file_path=file_path,
        parsed_text=parsed_text,
        cv_vector=cv_vector_json,
    )
    session.add(new_cv)
    session.commit()
    session.refresh(new_cv)

    # tạo đơn ứng tuyển, liên kết cv này với job
    application = JobApplication(job_id=job_id, cv_id=new_cv.id, status="pending")
    session.add(application)
    session.commit()
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
    session.commit()

    return {
        "message": "Nộp hồ sơ thành công",
        "cv_id": new_cv.id,
        "application_id": application.id,
        "job_title": job.title,
        "vector_saved": cv_vector_json is not None,
    }


@router.get("/job/{job_id}")
def list_cvs_for_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")

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
