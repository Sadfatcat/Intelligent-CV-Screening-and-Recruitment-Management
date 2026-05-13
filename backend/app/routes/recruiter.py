import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
import os
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


def _purge_activity_logs_for_target(session: Session, target_type: str, target_id: int):
    logs = session.exec(
        select(ActivityLog).where(
            ActivityLog.target_type == target_type,
            ActivityLog.target_id == target_id,
        )
    ).all()
    for log in logs:
        session.delete(log)


def parse_matching_detail(raw_detail: str | None):
    if not raw_detail:
        return None
    try:
        return json.loads(raw_detail)
    except (TypeError, json.JSONDecodeError):
        return None


def extract_cv_experience_years(cv: CV | None, matching_detail: dict | None) -> float | None:
    try:
        from app.services.matcher import extract_experience_years

        years = extract_experience_years(cv.parsed_text if cv else "")
        if years > 0:
            return years
    except Exception:
        pass

    for value in (matching_detail or {}).get("passes", []):
        if isinstance(value, str) and value.startswith("experience_years:"):
            try:
                return float(value.split(":", 1)[1])
            except (TypeError, ValueError):
                return None
    return None


@router.get("/{recruiter_id}/profile")
def get_recruiter_profile(recruiter_id: int, session: Session = Depends(get_session)):
    recruiter = require_recruiter(recruiter_id, session)
    return {
        "id": recruiter.id,
        "email": recruiter.email,
        "full_name": recruiter.full_name,
        "company_name": recruiter.company_name,
        "phone": recruiter.phone,
    }


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
            "quantity": j.quantity,
            "direct_contact": j.direct_contact,
            "image_url": j.image_url,
        }
        for j in jobs
    ]


@router.delete("/{recruiter_id}/jobs/{job_id}")
def delete_recruiter_job(
    recruiter_id: int,
    job_id: int,
    session: Session = Depends(get_session),
):
    recruiter = require_recruiter(recruiter_id, session)

    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xoá JD này")

    if job.jd_file_path and os.path.exists(job.jd_file_path):
        try:
            os.remove(job.jd_file_path)
        except OSError:
            pass

    if job.image_url:
        uploads_marker = "/uploads/"
        marker_index = job.image_url.find(uploads_marker)
        if marker_index != -1:
            cover_path = f"/app{job.image_url[marker_index:]}"
            if os.path.exists(cover_path):
                try:
                    os.remove(cover_path)
                except OSError:
                    pass

    applications = session.exec(select(JobApplication).where(JobApplication.job_id == job_id)).all()
    deleted_application_ids = []
    for app in applications:
        deleted_application_ids.append(app.id)
        session.delete(app)

    _purge_activity_logs_for_target(session, "job", job_id)
    for app_id in deleted_application_ids:
        _purge_activity_logs_for_target(session, "application", app_id)

    session.delete(job)
    session.commit()

    session.add(
        ActivityLog(
            actor_user_id=recruiter.id,
            actor_role="recruiter",
            action="recruiter.job.delete",
            target_type="job",
            target_id=job_id,
            detail=f"Deleted JD id={job_id}",
        )
    )
    session.commit()

    return {
        "message": "Xoá JD thành công",
        "job_id": job_id,
        "deleted_applications": len(deleted_application_ids),
    }


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
                "matching_detail": parse_matching_detail(app.matching_detail),
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


@router.delete("/{recruiter_id}/applications/{application_id}")
def delete_application_and_cv(
    recruiter_id: int,
    application_id: int,
    session: Session = Depends(get_session),
):
    recruiter = require_recruiter(recruiter_id, session)

    application = session.get(JobApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Không tìm thấy application")

    job = session.get(Job, application.job_id) if application.job_id else None
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xoá application này")

    cv = session.get(CV, application.cv_id) if application.cv_id else None
    cv_id = cv.id if cv else None
    cv_file_path = cv.file_path if cv else None

    session.delete(application)

    delete_cv_record = False
    if cv_id:
        remaining_apps = session.exec(
            select(JobApplication).where(
                JobApplication.cv_id == cv_id,
                JobApplication.id != application_id,
            )
        ).all()
        delete_cv_record = len(remaining_apps) == 0

    if delete_cv_record and cv:
        if cv_file_path and os.path.exists(cv_file_path):
            try:
                os.remove(cv_file_path)
            except OSError:
                pass
        session.delete(cv)

    _purge_activity_logs_for_target(session, "application", application_id)
    session.commit()

    session.add(
        ActivityLog(
            actor_user_id=recruiter.id,
            actor_role="recruiter",
            action="recruiter.application.delete",
            target_type="application",
            target_id=application_id,
            detail=f"Deleted application id={application_id}",
        )
    )
    session.commit()

    return {
        "message": "Xoá CV nộp thành công",
        "application_id": application_id,
        "deleted_cv": delete_cv_record,
    }


@router.get("/{recruiter_id}/applications/{application_id}/cv-file")
def view_application_cv_file(
    recruiter_id: int,
    application_id: int,
    inline: bool = Query(False),
    session: Session = Depends(get_session),
):
    require_recruiter(recruiter_id, session)

    application = session.get(JobApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Không tìm thấy application")

    job = session.get(Job, application.job_id) if application.job_id else None
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job")
    if job.recruiter_id != recruiter_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem CV này")

    cv = session.get(CV, application.cv_id) if application.cv_id else None
    if not cv or not cv.file_path:
        raise HTTPException(status_code=404, detail="Không tìm thấy file CV")
    if not os.path.exists(cv.file_path):
        raise HTTPException(status_code=404, detail="File CV không tồn tại trên server")

    ext = os.path.splitext(cv.file_path)[1].lower()
    media_type_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    media_type = media_type_map.get(ext, "application/octet-stream")
    filename = os.path.basename(cv.file_path)
    disposition = "inline" if inline else "attachment"

    return FileResponse(
        path=cv.file_path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )


@router.get("/{recruiter_id}/cv-logs")
def list_recruiter_cv_logs(recruiter_id: int, session: Session = Depends(get_session)):
    require_recruiter(recruiter_id, session)

    logs = session.exec(
        select(ActivityLog)
        .where(ActivityLog.action == "candidate.cv.submit")
        .order_by(ActivityLog.created_at.desc())
    ).all()

    result = []
    for log in logs:
        if log.target_type != "application" or log.target_id is None:
            continue

        application = session.get(JobApplication, log.target_id)
        if not application:
            continue

        job = session.get(Job, application.job_id) if application.job_id else None
        if not job or job.recruiter_id != recruiter_id:
            continue

        cv = session.get(CV, application.cv_id) if application.cv_id else None
        matching_detail = parse_matching_detail(application.matching_detail)
        result.append(
            {
                "log_id": log.id,
                "created_at": log.created_at,
                "job_id": job.id,
                "job_title": job.title,
                "application_id": application.id,
                "cv_id": cv.id if cv else None,
                "candidate_name": cv.candidate_name if cv else None,
                "candidate_email": cv.candidate_email if cv else None,
                "candidate_phone": cv.candidate_phone if cv else None,
                "status": application.status,
                "ai_matching_score": application.ai_matching_score,
                "matching_detail": matching_detail,
                "cv_file_name": os.path.basename(cv.file_path) if cv and cv.file_path else None,
                "experience_years": extract_cv_experience_years(cv, matching_detail),
            }
        )

    return result
