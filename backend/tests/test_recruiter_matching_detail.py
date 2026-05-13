import json
import sys

from sqlmodel import SQLModel, Session, create_engine

sys.path.insert(0, '..')

from app.models import ActivityLog, CV, Job, JobApplication, User
from app.routes import recruiter


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def _seed_application(session: Session, matching_detail=None):
    rec = User(email="rec@example.com", password_hash="hash", role="recruiter")
    session.add(rec)
    session.commit()
    session.refresh(rec)

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
        candidate_name="Alice",
        candidate_email="alice@example.com",
        candidate_phone="+84123456789",
        file_path="/tmp/alice.pdf",
    )
    session.add(job)
    session.add(cv)
    session.commit()
    session.refresh(job)
    session.refresh(cv)

    app = JobApplication(
        job_id=job.id,
        cv_id=cv.id,
        status="pending",
        ai_matching_score=82.4,
        matching_detail=matching_detail,
    )
    session.add(app)
    session.commit()
    session.refresh(app)

    log = ActivityLog(
        actor_user_id=None,
        actor_role="guest",
        action="candidate.cv.submit",
        target_type="application",
        target_id=app.id,
        detail="Submitted CV",
    )
    session.add(log)
    session.commit()
    return rec, job, cv, app


def test_recruiter_applications_return_parsed_matching_detail_when_valid():
    session = _make_session()
    detail = {"overall_score": 82.4, "sections": [{"key": "technical_skills"}]}
    rec, job, _cv, app = _seed_application(session, json.dumps(detail))

    try:
        response = recruiter.list_job_applications_for_recruiter(rec.id, job.id, session)
        item = response["applications"][0]

        assert item["application_id"] == app.id
        assert item["ai_matching_score"] == 82.4
        assert item["candidate_name"] == "Alice"
        assert item["matching_detail"] == detail
    finally:
        session.close()


def test_recruiter_applications_return_null_matching_detail_when_missing():
    session = _make_session()
    rec, job, _cv, _app = _seed_application(session, None)

    try:
        response = recruiter.list_job_applications_for_recruiter(rec.id, job.id, session)
        item = response["applications"][0]

        assert item["matching_detail"] is None
        assert "application_id" in item
        assert "ai_matching_score" in item
        assert "candidate_email" in item
    finally:
        session.close()


def test_recruiter_logs_return_null_matching_detail_when_invalid_json():
    session = _make_session()
    rec, _job, _cv, app = _seed_application(session, "{not-json")

    try:
        logs = recruiter.list_recruiter_cv_logs(rec.id, session)
        item = logs[0]

        assert item["application_id"] == app.id
        assert item["matching_detail"] is None
        assert "log_id" in item
        assert "job_title" in item
        assert "ai_matching_score" in item
    finally:
        session.close()
