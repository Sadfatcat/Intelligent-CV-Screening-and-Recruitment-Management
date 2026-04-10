import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select

from app.database import get_session
from app.models import Job
from app.services.extractor import extract_text
from app.services.vectorizer import text_to_vector_json

# prefix /api/jobs, tất cả route trong file này đều bắt đầu bằng /api/jobs/...
router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# thư mục lưu file JD trên server
UPLOAD_DIR = "/app/uploads/jd"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-jd")
async def upload_jd(
    recruiter_id: int = Form(...),
    title: str = Form(...),
    company_name: str = Form(...),
    location: str = Form(...),
    level: str = Form(...),
    deadline: str = Form(...),
    description: str = Form(...),
    jd_file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    if not jd_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="JD chỉ nhận file PDF")

    file_bytes = await jd_file.read()

    # lưu file JD vào ổ cứng, đặt tên bằng uuid để tránh trùng
    safe_name = f"{uuid.uuid4()}_{jd_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # đọc text từ PDF
    try:
        parsed_text = extract_text(file_bytes, jd_file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Không đọc được file JD: {str(e)}")

    # lưu vector JD, nếu lỗi thì để None, không ảnh hưởng phần còn lại
    try:
        jd_vector_json = text_to_vector_json(parsed_text) if parsed_text else None
    except Exception:
        jd_vector_json = None

    new_job = Job(
        recruiter_id=recruiter_id,
        title=title,
        company_name=company_name,
        location=location,
        level=level,
        deadline=deadline,
        description=description,
        jd_file_path=file_path,
        jd_parsed_text=parsed_text,
        jd_vector=jd_vector_json,
    )
    session.add(new_job)
    session.commit()
    session.refresh(new_job)

    return {
        "message": "Đăng JD thành công",
        "job_id": new_job.id,
        "vector_saved": jd_vector_json is not None,
    }


@router.get("/")
def list_jobs(session: Session = Depends(get_session)):
    jobs = session.exec(select(Job)).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "company_name": j.company_name,
            "location": j.location,
            "level": j.level,
            "deadline": j.deadline,
            "description": j.description,
            "image_url": j.image_url,
        }
        for j in jobs
    ]


@router.get("/{job_id}")
def get_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")

    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "location": job.location,
        "level": job.level,
        "deadline": job.deadline,
        "description": job.description,
        "image_url": job.image_url,
        "jd_parsed_text": job.jd_parsed_text,
        "vector_saved": job.jd_vector is not None,
    }
