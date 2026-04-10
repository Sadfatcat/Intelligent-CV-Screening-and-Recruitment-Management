from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import ActivityLog, Job, JobApplication, User
from app.security import get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateRecruiterRequest(BaseModel):
    admin_id: int
    email: str
    password: str
    company_name: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


def require_admin(admin_id: int, session: Session) -> User:
    admin = session.get(User, admin_id)
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ admin được phép thực hiện")
    return admin


@router.post("/recruiters")
def create_recruiter(payload: CreateRecruiterRequest, session: Session = Depends(get_session)):
    admin = require_admin(payload.admin_id, session)

    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã tồn tại")

    recruiter = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role="recruiter",
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
        company_name=payload.company_name,
        is_active=True,
    )
    session.add(recruiter)
    session.commit()
    session.refresh(recruiter)

    session.add(
        ActivityLog(
            actor_user_id=admin.id,
            actor_role="admin",
            action="admin.create.recruiter",
            target_type="user",
            target_id=recruiter.id,
            detail=f"Created recruiter account: {recruiter.email}",
        )
    )
    session.commit()

    return {
        "message": "Tạo tài khoản recruiter thành công",
        "recruiter_id": recruiter.id,
        "email": recruiter.email,
        "company_name": recruiter.company_name,
    }


@router.get("/recruiters")
def list_recruiters(admin_id: int = Query(...), session: Session = Depends(get_session)):
    require_admin(admin_id, session)
    recruiters = session.exec(select(User).where(User.role == "recruiter")).all()

    return [
        {
            "id": r.id,
            "email": r.email,
            "full_name": r.full_name,
            "company_name": r.company_name,
            "phone": r.phone,
            "is_active": r.is_active,
        }
        for r in recruiters
    ]


@router.get("/jobs")
def admin_list_jobs(admin_id: int = Query(...), session: Session = Depends(get_session)):
    require_admin(admin_id, session)

    jobs = session.exec(select(Job)).all()
    result = []
    for job in jobs:
        recruiter = session.get(User, job.recruiter_id) if job.recruiter_id else None
        applications_count = len(
            session.exec(select(JobApplication).where(JobApplication.job_id == job.id)).all()
        )
        result.append(
            {
                "id": job.id,
                "title": job.title,
                "company_name": job.company_name,
                "location": job.location,
                "level": job.level,
                "deadline": job.deadline,
                "recruiter_id": job.recruiter_id,
                "recruiter_email": recruiter.email if recruiter else None,
                "applications_count": applications_count,
            }
        )

    return result


@router.delete("/jobs/{job_id}")
def admin_delete_job(job_id: int, admin_id: int = Query(...), session: Session = Depends(get_session)):
    admin = require_admin(admin_id, session)

    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")

    applications = session.exec(select(JobApplication).where(JobApplication.job_id == job_id)).all()
    for app in applications:
        session.delete(app)

    session.delete(job)
    session.commit()

    session.add(
        ActivityLog(
            actor_user_id=admin.id,
            actor_role="admin",
            action="admin.delete.job",
            target_type="job",
            target_id=job_id,
            detail=f"Deleted job id={job_id}",
        )
    )
    session.commit()

    return {"message": "Đã xoá job", "job_id": job_id}


@router.get("/activities")
def list_activities(
    admin_id: int = Query(...),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
):
    require_admin(admin_id, session)

    logs = session.exec(select(ActivityLog).order_by(ActivityLog.id.desc()).limit(limit)).all()
    return [
        {
            "id": log.id,
            "actor_user_id": log.actor_user_id,
            "actor_role": log.actor_role,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "detail": log.detail,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/overview")
def admin_overview(admin_id: int = Query(...), session: Session = Depends(get_session)):
    require_admin(admin_id, session)
    total_candidates = len(session.exec(select(User).where(User.role == "candidate")).all())
    total_recruiters = len(session.exec(select(User).where(User.role == "recruiter")).all())
    total_jobs = len(session.exec(select(Job)).all())
    total_applications = len(session.exec(select(JobApplication)).all())

    return {
        "total_candidates": total_candidates,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
    }
