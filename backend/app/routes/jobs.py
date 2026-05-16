import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.database import get_session
from app.models import ActivityLog, Job, User
from app.services.matching_config import serialize_matching_config

# prefix /api/jobs, tất cả route trong file này đều bắt đầu bằng /api/jobs/...
router = APIRouter(prefix="/api/jobs", tags=["jobs"])
PUBLIC_UPLOAD_BASE_URL = os.getenv("PUBLIC_UPLOAD_BASE_URL", "").rstrip("/")
ENABLE_UPLOAD_VECTORS = os.getenv("ENABLE_UPLOAD_VECTORS", "0") == "1"

# thư mục lưu file JD trên server
UPLOAD_DIR = os.getenv("JD_UPLOAD_DIR", "/app/uploads/jd")
JOB_COVER_UPLOAD_DIR = os.getenv("JOB_COVER_UPLOAD_DIR", "/app/uploads/job_cover")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(JOB_COVER_UPLOAD_DIR, exist_ok=True)


def save_cover_image(cover_image: UploadFile | None) -> str | None:
    if not cover_image or not cover_image.filename:
        return None

    filename = cover_image.filename.lower()
    if not filename.endswith((".jpg", ".jpeg", ".png", ".webp")):
        raise HTTPException(status_code=400, detail="Cover image must be a jpg, jpeg, png, or webp file")

    safe_name = f"{uuid.uuid4()}_{cover_image.filename}"
    file_path = os.path.join(JOB_COVER_UPLOAD_DIR, safe_name)
    file_bytes = cover_image.file.read()
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    upload_path = f"/uploads/job_cover/{safe_name}"
    return f"{PUBLIC_UPLOAD_BASE_URL}{upload_path}" if PUBLIC_UPLOAD_BASE_URL else upload_path


@router.post("/upload-jd")
async def upload_jd(
    recruiter_id: int = Form(...),
    title: str = Form(...),
    company_name: str | None = Form(default=None),
    location: str = Form(...),
    level: str = Form(...),
    deadline: str = Form(...),
    quantity: int = Form(...),
    salary: str | None = Form(default=None),
    direct_contact: str = Form(...),
    description: str = Form(...),
    matching_config: str | None = Form(default=None),
    jd_file: UploadFile = File(...),
    cover_image: UploadFile | None = File(default=None),
    session: Session = Depends(get_session),
):
    recruiter = session.get(User, recruiter_id)
    if not recruiter or recruiter.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can post a JD")

    resolved_company_name = (recruiter.company_name or company_name or "").strip()
    if not resolved_company_name:
        raise HTTPException(
            status_code=400,
            detail="This recruiter account does not have a company name. Please ask an admin to update it before posting a JD.",
        )

    if not jd_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="JD upload only accepts PDF files")

    try:
        matching_config_json = serialize_matching_config(matching_config)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid matching_config: {str(exc)}")

    file_bytes = await jd_file.read()

    # lưu file JD vào ổ cứng, đặt tên bằng uuid để tránh trùng
    safe_name = f"{uuid.uuid4()}_{jd_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    image_url = save_cover_image(cover_image)

    # đọc text từ PDF (lazy import để không làm sập cả app nếu thiếu thư viện OCR/parser)
    try:
        from app.services.extractor import extract_text
        parsed_text = extract_text(file_bytes, jd_file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read JD file: {str(e)}")

    # Vector embedding khá nặng; mặc định tắt trong request upload để tránh timeout FE/proxy.
    jd_vector_json = None
    if ENABLE_UPLOAD_VECTORS:
        try:
            from app.services.vectorizer import text_to_vector_json
            jd_vector_json = text_to_vector_json(parsed_text) if parsed_text else None
        except Exception:
            jd_vector_json = None

    new_job = Job(
        recruiter_id=recruiter_id,
        title=title,
        company_name=resolved_company_name,
        location=location,
        level=level,
        deadline=deadline,
        quantity=quantity,
        salary=salary.strip() if salary else None,
        direct_contact=direct_contact,
        image_url=image_url,
        description=description,
        jd_file_path=file_path,
        jd_parsed_text=parsed_text,
        jd_vector=jd_vector_json,
        matching_config=matching_config_json,
    )
    session.add(new_job)
    session.commit()
    session.refresh(new_job)

    session.add(
        ActivityLog(
            actor_user_id=recruiter_id,
            actor_role="recruiter",
            action="recruiter.job.upload",
            target_type="job",
            target_id=new_job.id,
            detail=f"Uploaded JD: {title}",
        )
    )
    session.commit()

    return {
        "message": "JD posted successfully",
        "job_id": new_job.id,
        "vector_saved": jd_vector_json is not None,
        "matching_config_saved": matching_config_json is not None,
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
            "quantity": j.quantity,
            "salary": j.salary,
            "direct_contact": j.direct_contact,
            "description": j.description,
            "image_url": j.image_url,
            "jd_file_path": j.jd_file_path,
        }
        for j in jobs
    ]


@router.get("/{job_id}")
def get_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "location": job.location,
        "level": job.level,
        "deadline": job.deadline,
        "quantity": job.quantity,
        "salary": job.salary,
        "direct_contact": job.direct_contact,
        "description": job.description,
        "image_url": job.image_url,
        "jd_parsed_text": job.jd_parsed_text,
        "vector_saved": job.jd_vector is not None,
        "jd_file_path": job.jd_file_path,
    }


@router.get("/{job_id}/jd-file")
def download_job_jd_file(job_id: int, inline: bool = Query(False), session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if not job.jd_file_path or not os.path.exists(job.jd_file_path):
        raise HTTPException(status_code=404, detail="JD file does not exist")
    
    filename = f"JD_{job.id}_{job.title}.pdf".replace(" ", "_")
    
    if inline:
        # Mở trong browser
        return FileResponse(
            path=job.jd_file_path,
            media_type="application/pdf"
        )
    else:
        # Tải file
        return FileResponse(
            path=job.jd_file_path,
            filename=filename,
            media_type="application/pdf"
        )
