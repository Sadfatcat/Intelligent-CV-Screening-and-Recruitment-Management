from pathlib import Path
import sys

sys.path.insert(0, '..')

from app.models import Job, JobApplication


def test_job_application_has_matching_detail_field():
    app = JobApplication(ai_matching_score=88.5, matching_detail='{"final_score": 88.5}')

    assert app.matching_detail == '{"final_score": 88.5}'


def test_job_application_keeps_ai_matching_score_field():
    app = JobApplication(ai_matching_score=77.0)

    assert app.ai_matching_score == 77.0


def test_job_has_optional_matching_config_field():
    job = Job(
        title="Backend Engineer",
        company_name="Tech Co",
        location="Remote",
        level="Mid",
        deadline="2026-12-31",
        description="Backend role",
        matching_config='{"weights": {"technical_skills": 1.0}}',
    )

    assert job.matching_config == '{"weights": {"technical_skills": 1.0}}'


def test_startup_migration_adds_matching_detail_non_destructively():
    database_py = Path(__file__).resolve().parents[1] / "app" / "database.py"
    source = database_py.read_text(encoding="utf-8")

    assert "ALTER TABLE jobapplication ADD COLUMN IF NOT EXISTS matching_detail TEXT" in source


def test_startup_migration_adds_matching_config_non_destructively():
    database_py = Path(__file__).resolve().parents[1] / "app" / "database.py"
    source = database_py.read_text(encoding="utf-8")

    assert "ALTER TABLE job ADD COLUMN IF NOT EXISTS matching_config TEXT" in source


def test_model_imports_do_not_fail():
    assert JobApplication.__tablename__ == "jobapplication"
    assert Job.__tablename__ == "job"
