import asyncio
import json
import os
import tempfile
import sys

os.environ.setdefault("CV_UPLOAD_DIR", tempfile.gettempdir())

from fastapi import BackgroundTasks
from sqlmodel import SQLModel, Session, create_engine, select

sys.path.insert(0, '..')

from app.models import ActivityLog, CV, Job, JobApplication
from app.routes import cvs
from app.services import extractor, vectorizer, matcher
from tests.factories import make_user


CV_TEXT = """
Skills: Python, FastAPI, PostgreSQL
Experience: 4 years backend developer building REST APIs
Projects: REST API ecommerce project
Languages: English
"""

JD_TEXT = """
Backend Engineer
Requirements: Python, FastAPI, PostgreSQL, 3 years backend experience
Language: English
Responsibilities: Build REST APIs
"""


def _make_session():
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    engine = create_engine(f"sqlite:///{db_path}")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


class FakeUploadFile:
    def __init__(self, filename="candidate.pdf", content=b"fake file bytes"):
        self.filename = filename
        self._content = content

    async def read(self):
        return self._content


def _make_upload_file(filename="candidate.pdf"):
    return FakeUploadFile(filename=filename)


def _seed_job_and_candidate(session: Session):
    recruiter = make_user("recruiter@example.com", "recruiter")
    candidate = make_user("candidate@example.com", "candidate")
    session.add(recruiter)
    session.add(candidate)
    session.commit()
    session.refresh(recruiter)
    session.refresh(candidate)

    job = Job(
        recruiter_id=recruiter.id,
        title="Backend Engineer",
        company_name="Tech Co",
        location="Remote",
        level="Mid",
        deadline="2026-12-31",
        description="Backend role",
        jd_parsed_text=JD_TEXT,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job, candidate


def _run_upload(session: Session, job_id: int, candidate_id: int | None = None, run_background: bool = True):
    background_tasks = BackgroundTasks()
    response = asyncio.run(
        cvs.upload_cv(
            background_tasks=background_tasks,
            job_id=job_id,
            candidate_name="Alice",
            candidate_email="alice@example.com",
            candidate_phone="+84123456789",
            candidate_id=candidate_id,
            cv_file=_make_upload_file(),
            session=session,
        )
    )
    if run_background:
        original_engine = cvs.engine
        cvs.engine = session.get_bind()
        try:
            for task in background_tasks.tasks:
                task.func(*task.args, **task.kwargs)
        finally:
            cvs.engine = original_engine
    return response


def test_cv_upload_creates_cv_application_and_matching_detail():
    original_upload_dir = cvs.UPLOAD_DIR
    original_extract_text = extractor.extract_text
    original_vectorizer = vectorizer.text_to_vector_json
    with tempfile.TemporaryDirectory() as tmpdir:
        cvs.UPLOAD_DIR = tmpdir
        extractor.extract_text = lambda file_bytes, filename: CV_TEXT
        vectorizer.text_to_vector_json = lambda text: "[1.0, 0.0]"
        session = _make_session()
        job, candidate = _seed_job_and_candidate(session)

        try:
            response = _run_upload(session, job.id, candidate.id)
            cv = session.exec(select(CV)).first()
            application = session.exec(select(JobApplication)).first()

            assert cv is not None
            assert application is not None
            session.refresh(application)
            assert application.ai_matching_score is not None
            assert application.matching_detail is not None
            detail = json.loads(application.matching_detail)
            assert detail["final_score"] == application.ai_matching_score
            assert detail["overall_score"] == application.ai_matching_score
            assert response["cv_id"] == cv.id
            assert response["application_id"] == application.id
            assert response["matching_score"] is None
            assert response["matching_detail"] is None
            assert response["message"] == "Application submitted successfully. Scoring is in progress."
            assert response["status"] == "scoring"
            assert application.status == "pending"
            assert response["job_title"] == job.title
            assert response["vector_saved"] is False
        finally:
            session.close()
            cvs.UPLOAD_DIR = original_upload_dir
            extractor.extract_text = original_extract_text
            vectorizer.text_to_vector_json = original_vectorizer


def test_cv_upload_does_not_crash_when_detailed_matcher_fails():
    original_upload_dir = cvs.UPLOAD_DIR
    original_extract_text = extractor.extract_text
    original_vectorizer = vectorizer.text_to_vector_json
    original_score_cv_vs_jd = matcher.score_cv_vs_jd
    with tempfile.TemporaryDirectory() as tmpdir:
        cvs.UPLOAD_DIR = tmpdir
        extractor.extract_text = lambda file_bytes, filename: CV_TEXT
        vectorizer.text_to_vector_json = lambda text: None

        def raise_matcher(cv_text, jd_text, **kwargs):
            raise RuntimeError("forced matcher failure")

        matcher.score_cv_vs_jd = raise_matcher
        session = _make_session()
        job, candidate = _seed_job_and_candidate(session)

        try:
            response = _run_upload(session, job.id, candidate.id)
            application = session.exec(select(JobApplication)).first()
            cv = session.exec(select(CV)).first()

            assert cv is not None
            assert application is not None
            session.refresh(application)
            assert application.ai_matching_score is None
            assert application.matching_detail is None
            assert response["matching_score"] is None
            assert response["matching_detail"] is None
            assert response["application_id"] == application.id
            assert response["cv_id"] == cv.id
            assert application.status == "pending"
        finally:
            session.close()
            cvs.UPLOAD_DIR = original_upload_dir
            extractor.extract_text = original_extract_text
            vectorizer.text_to_vector_json = original_vectorizer
            matcher.score_cv_vs_jd = original_score_cv_vs_jd


def test_cv_upload_uses_job_matching_config_for_custom_weights_and_must_have():
    original_upload_dir = cvs.UPLOAD_DIR
    original_extract_text = extractor.extract_text
    original_vectorizer = vectorizer.text_to_vector_json
    original_score_cv_vs_jd = matcher.score_cv_vs_jd
    captured = {}
    with tempfile.TemporaryDirectory() as tmpdir:
        cvs.UPLOAD_DIR = tmpdir
        extractor.extract_text = lambda file_bytes, filename: CV_TEXT
        vectorizer.text_to_vector_json = lambda text: "[1.0, 0.0]"

        def fake_matcher(cv_text, jd_text, **kwargs):
            captured.update(kwargs)
            return {
                "overall_score": 91.0,
                "final_score": 91.0,
                "sections": [],
                "good_points": [],
                "missing_points": [],
                "must_have": {"matched": ["Python"], "missing": [], "penalty_applied": 0.0},
            }

        matcher.score_cv_vs_jd = fake_matcher
        session = _make_session()
        job, candidate = _seed_job_and_candidate(session)
        job.matching_config = json.dumps({
            "weights": {"technical_skills": 0.8, "experience": 0.2},
            "must_have": ["Python"],
        })
        session.add(job)
        session.commit()

        try:
            response = _run_upload(session, job.id, candidate.id)
            application = session.exec(select(JobApplication)).first()

            assert captured["weights"] == {"technical_skills": 0.8, "experience": 0.2}
            assert captured["must_have"] == ["Python"]
            session.refresh(application)
            assert application.ai_matching_score == 91.0
            assert json.loads(application.matching_detail)["final_score"] == 91.0
            assert response["matching_detail"] is None
            assert response["matching_score"] is None
        finally:
            session.close()
            cvs.UPLOAD_DIR = original_upload_dir
            extractor.extract_text = original_extract_text
            vectorizer.text_to_vector_json = original_vectorizer
            matcher.score_cv_vs_jd = original_score_cv_vs_jd


def test_candidate_applications_merge_candidate_id_email_and_activity_log_sources():
    session = _make_session()
    job, candidate = _seed_job_and_candidate(session)

    linked_cv = CV(
        candidate_id=candidate.id,
        candidate_name="Linked Candidate",
        candidate_email="linked@example.com",
        candidate_phone="1",
        file_path="/tmp/linked.pdf",
    )
    email_cv = CV(
        candidate_id=None,
        candidate_name="Email Candidate",
        candidate_email="CANDIDATE@example.com",
        candidate_phone="2",
        file_path="/tmp/email.pdf",
    )
    logged_cv = CV(
        candidate_id=None,
        candidate_name="Logged Candidate",
        candidate_email="guest@example.com",
        candidate_phone="3",
        file_path="/tmp/logged.pdf",
    )
    unrelated_cv = CV(
        candidate_id=None,
        candidate_name="Other Candidate",
        candidate_email="other@example.com",
        candidate_phone="4",
        file_path="/tmp/other.pdf",
    )
    session.add(linked_cv)
    session.add(email_cv)
    session.add(logged_cv)
    session.add(unrelated_cv)
    session.commit()
    session.refresh(linked_cv)
    session.refresh(email_cv)
    session.refresh(logged_cv)
    session.refresh(unrelated_cv)

    linked_application = JobApplication(job_id=job.id, cv_id=linked_cv.id, status="scoring")
    email_application = JobApplication(job_id=job.id, cv_id=email_cv.id, status="pending", ai_matching_score=82.0)
    logged_application = JobApplication(job_id=job.id, cv_id=logged_cv.id, status="pending", ai_matching_score=91.0)
    unrelated_application = JobApplication(job_id=job.id, cv_id=unrelated_cv.id, status="pending", ai_matching_score=44.0)
    session.add(linked_application)
    session.add(email_application)
    session.add(logged_application)
    session.add(unrelated_application)
    session.commit()
    session.refresh(linked_application)
    session.refresh(email_application)
    session.refresh(logged_application)
    session.refresh(unrelated_application)

    session.add(
        ActivityLog(
            actor_user_id=candidate.id,
            actor_role="candidate",
            action="candidate.cv.submit",
            target_type="application",
            target_id=logged_application.id,
            detail="Submitted as logged candidate",
        )
    )
    session.add(
        ActivityLog(
            actor_user_id=candidate.id,
            actor_role="candidate",
            action="candidate.cv.submit",
            target_type="application",
            target_id=email_application.id,
            detail="Duplicate source for email candidate",
        )
    )
    session.commit()

    try:
        response = cvs.list_candidate_applications(candidate.id, session)
        application_ids = [item["application_id"] for item in response["applications"]]

        assert response["total"] == 3
        assert application_ids == sorted(application_ids, reverse=True)
        assert set(application_ids) == {
            linked_application.id,
            email_application.id,
            logged_application.id,
        }
        assert unrelated_application.id not in application_ids

        linked_item = next(item for item in response["applications"] if item["application_id"] == linked_application.id)
        assert linked_item["status"] == "scoring"
        assert linked_item["ai_matching_score"] is None
    finally:
        session.close()
