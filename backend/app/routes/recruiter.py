from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.database import get_session
from app.models import ActivityLog, CV, Job, JobApplication, User

router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])


class UpdateApplicationStatusRequest(BaseModel):
    status: str


def require_recruiter(recruiter_id: int, session: Session) -> User:
    recruiter = session.get(User, recruiter_id)
    if not recruiter or recruiter.role != "recruiter":
        raise HTTPException(status_code=403, detail="Chỉ recruiter được phép thực hiện")
    return recruiter


@router.get("/{recruiter_id}/jobs")
def list_recruiter_jobs(recruiter_id: int, session: Session = Depends(get_session)):
    require_recruiter(recruiter_id, session)
    jobs = session.exec(select(Job).where(Job.recruiter_id == recruiter_id)).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "company_name": j.company_name,
            "location": j.location,
            "level": j.level,
            "deadline": j.deadline,
        }
        for j in jobs
    ]


@router.get("/{recruiter_id}/jobs/{job_id}/applications")
def list_job_applications_for_recruiter(
    recruiter_id: int,
    job_id: int,
    session: Session = Depends(get_session),
):
    require_recruiter(recruiter_id, session)
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền với JD này")

    applications = session.exec(select(JobApplication).where(JobApplication.job_id == job_id)).all()
    result = []
    for app in applications:
        cv = session.get(CV, app.cv_id)
        result.append(
            {
                "application_id": app.id,
                "status": app.status,
                "ai_matching_score": app.ai_matching_score,
                "cv_id": app.cv_id,
                "candidate_name": cv.candidate_name if cv else None,
                "candidate_email": cv.candidate_email if cv else None,
                "candidate_phone": cv.candidate_phone if cv else None,
            }
        )

    return {"job_id": job_id, "job_title": job.title, "applications": result}


@router.patch("/{recruiter_id}/applications/{application_id}")
def update_application_status(
    recruiter_id: int,
    application_id: int,
    payload: UpdateApplicationStatusRequest,
    session: Session = Depends(get_session),
):
    recruiter = require_recruiter(recruiter_id, session)

    if payload.status not in {"pending", "reviewed", "accepted", "rejected"}:
        raise HTTPException(status_code=400, detail="Status không hợp lệ")

    application = session.get(JobApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Không tìm thấy application")

    job = session.get(Job, application.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền với application này")

    application.status = payload.status
    session.add(application)
    session.commit()
    session.refresh(application)

    session.add(
        ActivityLog(
            actor_user_id=recruiter.id,
            actor_role="recruiter",
            action="recruiter.application.status.update",
            target_type="application",
            target_id=application.id,
            detail=f"Set status to {payload.status}",
        )
    )
    session.commit()

    return {"message": "Cập nhật trạng thái thành công", "application_id": application.id, "status": application.status}
