import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select

from app.database import get_session
from app.models import ActivityLog, Job, User

# prefix /api/jobs, tất cả route trong file này đều bắt đầu bằng /api/jobs/...
router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# thư mục lưu file JD trên server
UPLOAD_DIR = "/app/uploads/jd"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-jd")
async def upload_jd(
    recruiter_id: int = Form(...),
    title: str = Form(...),
    company_name: str | None = Form(default=None),
    location: str = Form(...),
    level: str = Form(...),
    deadline: str = Form(...),
    quantity: int = Form(...),
    direct_contact: str = Form(...),
    description: str = Form(...),
    jd_file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    recruiter = session.get(User, recruiter_id)
    if not recruiter or recruiter.role != "recruiter":
        raise HTTPException(status_code=403, detail="Chỉ recruiter được phép đăng JD")

    resolved_company_name = (recruiter.company_name or company_name or "").strip()
    if not resolved_company_name:
        raise HTTPException(
            status_code=400,
            detail="Tài khoản recruiter chưa có company_name. Vui lòng nhờ admin cập nhật trước khi đăng JD.",
        )

    if not jd_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="JD chỉ nhận file PDF")

    file_bytes = await jd_file.read()

    # lưu file JD vào ổ cứng, đặt tên bằng uuid để tránh trùng
    safe_name = f"{uuid.uuid4()}_{jd_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # đọc text từ PDF (lazy import để không làm sập cả app nếu thiếu thư viện OCR/parser)
    try:
        from app.services.extractor import extract_text
        parsed_text = extract_text(file_bytes, jd_file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Không đọc được file JD: {str(e)}")

    # lưu vector JD, nếu lỗi thì để None, không ảnh hưởng phần còn lại
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
        direct_contact=direct_contact,
        description=description,
        jd_file_path=file_path,
        jd_parsed_text=parsed_text,
        jd_vector=jd_vector_json,
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
            "quantity": j.quantity,
            "direct_contact": j.direct_contact,
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
        "quantity": job.quantity,
        "direct_contact": job.direct_contact,
        "description": job.description,
        "image_url": job.image_url,
        "jd_parsed_text": job.jd_parsed_text,
        "vector_saved": job.jd_vector is not None,
    }
