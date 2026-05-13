import asyncio
import json
import os
import tempfile
import sys

os.environ.setdefault("JD_UPLOAD_DIR", tempfile.gettempdir())
os.environ.setdefault("JOB_COVER_UPLOAD_DIR", tempfile.gettempdir())

from fastapi import HTTPException
from sqlmodel import SQLModel, Session, create_engine, select

sys.path.insert(0, '..')

from app.models import Job, User
from app.routes import jobs
from app.services import extractor, vectorizer


class FakeUploadFile:
    def __init__(self, filename="backend.pdf", content=b"fake jd bytes"):
        self.filename = filename
        self._content = content
        self.file = self

    async def read(self):
        return self._content

    def read_sync(self):
        return self._content


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def _seed_recruiter(session: Session):
    recruiter = User(
        email="recruiter@example.com",
        password_hash="hash",
        role="recruiter",
        company_name="Tech Co",
    )
    session.add(recruiter)
    session.commit()
    session.refresh(recruiter)
    return recruiter


def _run_upload(session: Session, recruiter_id: int, matching_config: str | None = None):
    return asyncio.run(
        jobs.upload_jd(
            recruiter_id=recruiter_id,
            title="Backend Engineer",
            company_name=None,
            location="Remote",
            level="Mid",
            deadline="2026-12-31",
            quantity=1,
            direct_contact="hr@example.com",
            description="Backend role",
            matching_config=matching_config,
            jd_file=FakeUploadFile(),
            cover_image=None,
            session=session,
        )
    )


def test_upload_jd_without_matching_config_still_works():
    original_upload_dir = jobs.UPLOAD_DIR
    original_extract_text = extractor.extract_text
    original_vectorizer = vectorizer.text_to_vector_json
    with tempfile.TemporaryDirectory() as tmpdir:
        jobs.UPLOAD_DIR = tmpdir
        extractor.extract_text = lambda file_bytes, filename: "Requirements: Python and FastAPI"
        vectorizer.text_to_vector_json = lambda text: "[1.0, 0.0]"
        session = _make_session()
        recruiter = _seed_recruiter(session)

        try:
            response = _run_upload(session, recruiter.id)
            job = session.exec(select(Job)).first()

            assert job is not None
            assert job.matching_config is None
            assert response["job_id"] == job.id
            assert response["matching_config_saved"] is False
        finally:
            session.close()
            jobs.UPLOAD_DIR = original_upload_dir
            extractor.extract_text = original_extract_text
            vectorizer.text_to_vector_json = original_vectorizer


def test_upload_jd_with_valid_matching_config_saves_config():
    original_upload_dir = jobs.UPLOAD_DIR
    original_extract_text = extractor.extract_text
    original_vectorizer = vectorizer.text_to_vector_json
    raw_config = json.dumps({
        "weights": {"technical_skills": 0.7, "experience": 0.3},
        "must_have": ["Python", "FastAPI"],
    })
    with tempfile.TemporaryDirectory() as tmpdir:
        jobs.UPLOAD_DIR = tmpdir
        extractor.extract_text = lambda file_bytes, filename: "Requirements: Python and FastAPI"
        vectorizer.text_to_vector_json = lambda text: "[1.0, 0.0]"
        session = _make_session()
        recruiter = _seed_recruiter(session)

        try:
            response = _run_upload(session, recruiter.id, raw_config)
            job = session.exec(select(Job)).first()
            saved_config = json.loads(job.matching_config)

            assert response["matching_config_saved"] is True
            assert saved_config["weights"] == {"technical_skills": 0.7, "experience": 0.3}
            assert saved_config["must_have"] == ["Python", "FastAPI"]
        finally:
            session.close()
            jobs.UPLOAD_DIR = original_upload_dir
            extractor.extract_text = original_extract_text
            vectorizer.text_to_vector_json = original_vectorizer


def test_upload_jd_with_invalid_matching_config_returns_validation_error():
    session = _make_session()
    recruiter = _seed_recruiter(session)

    try:
        try:
            _run_upload(session, recruiter.id, '{"weights": {"technical_skills": -1}}')
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "matching_config" in exc.detail
        else:
            raise AssertionError("Expected invalid matching_config to raise HTTPException")
    finally:
        session.close()
