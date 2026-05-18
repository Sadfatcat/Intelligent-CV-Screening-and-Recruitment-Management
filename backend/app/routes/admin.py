import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import ActivityLog, CV, Job, JobApplication, User
from app.security import get_password_hash, verify_password

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
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    return admin


def _delete_file_if_exists(path: str | None):
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


def _resolve_cover_path_from_url(image_url: str | None) -> str | None:
    if not image_url:
        return None

    uploads_marker = "/uploads/"
    marker_index = image_url.find(uploads_marker)
    if marker_index == -1:
        return None
    return f"/app{image_url[marker_index:]}"


def _purge_activity_logs_for_target(session: Session, target_type: str, target_id: int):
    logs = session.exec(
        select(ActivityLog).where(
            ActivityLog.target_type == target_type,
            ActivityLog.target_id == target_id,
        )
    ).all()
    for log in logs:
        session.delete(log)


def _delete_job_and_dependencies(session: Session, job: Job) -> dict:
    applications = session.exec(select(JobApplication).where(JobApplication.job_id == job.id)).all()
    deleted_application_ids = []
    for app in applications:
        deleted_application_ids.append(app.id)
        session.delete(app)

    _delete_file_if_exists(job.jd_file_path)
    _delete_file_if_exists(_resolve_cover_path_from_url(job.image_url))

    _purge_activity_logs_for_target(session, "job", job.id)
    for app_id in deleted_application_ids:
        _purge_activity_logs_for_target(session, "application", app_id)

    session.delete(job)
    return {
        "deleted_applications": len(deleted_application_ids),
        "deleted_application_ids": deleted_application_ids,
    }


@router.post("/recruiters")
def create_recruiter(payload: CreateRecruiterRequest, session: Session = Depends(get_session)):
    admin = require_admin(payload.admin_id, session)

    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email already exists")

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
        "message": "Recruiter account created successfully",
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
                "status": job.status,
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
        raise HTTPException(status_code=404, detail="Job not found")

    cleanup = _delete_job_and_dependencies(session, job)
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

    return {
        "message": "Job deleted",
        "job_id": job_id,
        "deleted_applications": cleanup["deleted_applications"],
    }


@router.delete("/candidates/{candidate_id}")
def admin_delete_candidate(
    candidate_id: int,
    admin_id: int = Query(...),
    session: Session = Depends(get_session),
):
    admin = require_admin(admin_id, session)

    candidate = session.get(User, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if candidate.role != "candidate":
        raise HTTPException(status_code=400, detail="This user is not a candidate")

    cvs = session.exec(select(CV).where(CV.candidate_id == candidate_id)).all()
    deleted_cv_ids = []
    deleted_application_ids = []

    for cv in cvs:
        applications = session.exec(select(JobApplication).where(JobApplication.cv_id == cv.id)).all()
        for app in applications:
            deleted_application_ids.append(app.id)
            session.delete(app)

        _delete_file_if_exists(cv.file_path)
        deleted_cv_ids.append(cv.id)
        session.delete(cv)

    for cv_id in deleted_cv_ids:
        _purge_activity_logs_for_target(session, "cv", cv_id)
    for app_id in deleted_application_ids:
        _purge_activity_logs_for_target(session, "application", app_id)

    user_logs = session.exec(select(ActivityLog).where(ActivityLog.actor_user_id == candidate_id)).all()
    for log in user_logs:
        session.delete(log)
    _purge_activity_logs_for_target(session, "user", candidate_id)

    session.delete(candidate)
    session.commit()

    session.add(
        ActivityLog(
            actor_user_id=admin.id,
            actor_role="admin",
            action="admin.delete.candidate",
            target_type="user",
            target_id=candidate_id,
            detail=f"Deleted candidate id={candidate_id}",
        )
    )
    session.commit()

    return {
        "message": "Candidate deleted",
        "candidate_id": candidate_id,
        "deleted_cvs": len(deleted_cv_ids),
        "deleted_applications": len(deleted_application_ids),
    }


@router.delete("/recruiters/{recruiter_id}")
def admin_delete_recruiter(
    recruiter_id: int,
    admin_id: int = Query(...),
    session: Session = Depends(get_session),
):
    admin = require_admin(admin_id, session)

    recruiter = session.get(User, recruiter_id)
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    if recruiter.role != "recruiter":
        raise HTTPException(status_code=400, detail="This user is not a recruiter")

    jobs = session.exec(select(Job).where(Job.recruiter_id == recruiter_id)).all()
    deleted_job_ids = []
    deleted_applications = 0

    for job in jobs:
        cleanup = _delete_job_and_dependencies(session, job)
        deleted_job_ids.append(job.id)
        deleted_applications += cleanup["deleted_applications"]

    user_logs = session.exec(select(ActivityLog).where(ActivityLog.actor_user_id == recruiter_id)).all()
    for log in user_logs:
        session.delete(log)
    _purge_activity_logs_for_target(session, "user", recruiter_id)

    session.delete(recruiter)
    session.commit()

    session.add(
        ActivityLog(
            actor_user_id=admin.id,
            actor_role="admin",
            action="admin.delete.recruiter",
            target_type="user",
            target_id=recruiter_id,
            detail=f"Deleted recruiter id={recruiter_id}",
        )
    )
    session.commit()

    return {
        "message": "Recruiter/company deleted",
        "recruiter_id": recruiter_id,
        "deleted_jobs": len(deleted_job_ids),
        "deleted_applications": deleted_applications,
    }


@router.get("/activities")
def list_activities(
    admin_id: int = Query(...),
    limit: int = Query(50, ge=1, le=1000),
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
    admins = session.exec(select(User).where(User.role == "admin")).all()
    recruiters = session.exec(select(User).where(User.role == "recruiter")).all()
    default_password_recruiters = [
        recruiter for recruiter in recruiters if verify_password("1", recruiter.password_hash)
    ]
    total_candidates = len(session.exec(select(User).where(User.role == "candidate")).all())
    total_jobs = len(session.exec(select(Job)).all())
    total_applications = len(session.exec(select(JobApplication)).all())

    return {
        "total_admins": len(admins),
        "total_candidates": total_candidates,
        "total_recruiters": len(recruiters),
        "active_admins": len([user for user in admins if user.is_active]),
        "inactive_admins": len([user for user in admins if not user.is_active]),
        "active_recruiters": len([user for user in recruiters if user.is_active]),
        "inactive_recruiters": len([user for user in recruiters if not user.is_active]),
        "recruiters_with_default_password": len(default_password_recruiters),
        "total_jobs": total_jobs,
        "total_applications": total_applications,
    }
