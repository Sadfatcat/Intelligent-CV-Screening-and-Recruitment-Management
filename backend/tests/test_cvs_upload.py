import asyncio
import json
import os
import tempfile
import sys

os.environ.setdefault("CV_UPLOAD_DIR", tempfile.gettempdir())

from sqlmodel import SQLModel, Session, create_engine, select

sys.path.insert(0, '..')

from app.models import CV, Job, JobApplication, User
from app.routes import cvs
from app.services import extractor, vectorizer, matcher


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
    engine = create_engine("sqlite:///:memory:")
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
    recruiter = User(email="recruiter@example.com", password_hash="hash", role="recruiter")
    candidate = User(email="candidate@example.com", password_hash="hash", role="candidate")
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


def _run_upload(session: Session, job_id: int, candidate_id: int | None = None):
    return asyncio.run(
        cvs.upload_cv(
            job_id=job_id,
            candidate_name="Alice",
            candidate_email="alice@example.com",
            candidate_phone="+84123456789",
            candidate_id=candidate_id,
            cv_file=_make_upload_file(),
            session=session,
        )
    )


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
            assert application.ai_matching_score is not None
            assert application.matching_detail is not None
            detail = json.loads(application.matching_detail)
            assert detail["final_score"] == application.ai_matching_score
            assert detail["overall_score"] == application.ai_matching_score
            assert response["cv_id"] == cv.id
            assert response["application_id"] == application.id
            assert response["matching_score"] == application.ai_matching_score
            assert response["matching_detail"]["final_score"] == application.ai_matching_score
            assert response["message"] == "Nộp hồ sơ thành công"
            assert response["job_title"] == job.title
            assert "vector_saved" in response
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
            assert application.ai_matching_score is None
            assert application.matching_detail is None
            assert response["matching_score"] is None
            assert response["matching_detail"] is None
            assert response["application_id"] == application.id
            assert response["cv_id"] == cv.id
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
            assert application.ai_matching_score == 91.0
            assert json.loads(application.matching_detail)["final_score"] == 91.0
            assert response["matching_detail"]["final_score"] == response["matching_score"]
        finally:
            session.close()
            cvs.UPLOAD_DIR = original_upload_dir
            extractor.extract_text = original_extract_text
            vectorizer.text_to_vector_json = original_vectorizer
            matcher.score_cv_vs_jd = original_score_cv_vs_jd
