import sys

from fastapi import HTTPException
from sqlmodel import SQLModel, Session, create_engine

sys.path.insert(0, '..')

from app.models import CV, Job, JobApplication, User
from app.routes import recruiter


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def _seed_recruiter_job_application(session: Session):
    rec = User(email="rec@example.com", password_hash="hash", role="recruiter")
    other_rec = User(email="other@example.com", password_hash="hash", role="recruiter")
    candidate = User(email="candidate@example.com", password_hash="hash", role="candidate")
    session.add(rec)
    session.add(other_rec)
    session.add(candidate)
    session.commit()
    session.refresh(rec)
    session.refresh(other_rec)
    session.refresh(candidate)

    job = Job(
        recruiter_id=rec.id,
        title="Backend Engineer",
        company_name="Tech Co",
        location="Remote",
        level="Mid",
        deadline="2026-12-31",
        description="Backend role",
    )
    cv = CV(
        candidate_id=candidate.id,
        candidate_name="Candidate",
        candidate_email="candidate@example.com",
        candidate_phone="+84000000000",
        file_path="/tmp/nonexistent.pdf",
    )
    session.add(job)
    session.add(cv)
    session.commit()
    session.refresh(job)
    session.refresh(cv)

    app = JobApplication(job_id=job.id, cv_id=cv.id, ai_matching_score=80.0, status="pending")
    session.add(app)
    session.commit()
    session.refresh(app)
    return rec, other_rec, job, cv, app


def test_recruiter_job_list_rejects_candidate_user():
    session = _make_session()
    try:
        candidate = User(email="candidate@example.com", password_hash="hash", role="candidate")
        session.add(candidate)
        session.commit()
        session.refresh(candidate)

        try:
            recruiter.list_recruiter_jobs(candidate.id, session)
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("Expected candidate to be rejected by recruiter route")
    finally:
        session.close()


def test_recruiter_cannot_access_another_recruiter_job_applications():
    session = _make_session()
    try:
        _rec, other_rec, job, _cv, _app = _seed_recruiter_job_application(session)

        try:
            recruiter.list_job_applications_for_recruiter(other_rec.id, job.id, session)
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("Expected other recruiter to be forbidden")
    finally:
        session.close()


def test_recruiter_delete_job_currently_deletes_applications_known_data_loss_risk():
    session = _make_session()
    try:
        rec, _other_rec, job, cv, app = _seed_recruiter_job_application(session)

        response = recruiter.delete_recruiter_job(rec.id, job.id, session)

        assert response["deleted_applications"] == 1
        assert session.get(JobApplication, app.id) is None
        assert session.get(Job, job.id) is None
        assert session.get(CV, cv.id) is not None
    finally:
        session.close()
