import sys

from fastapi import HTTPException
from sqlmodel import SQLModel, Session, create_engine, select

sys.path.insert(0, '..')

from app.routes import admin
from tests.factories import make_user


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def _seed_admin(session: Session):
    admin_user = make_user("admin@example.com", "admin")
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    return admin_user


def test_admin_can_create_and_list_recruiter():
    session = _make_session()
    try:
        admin_user = _seed_admin(session)
        created = admin.create_recruiter(
            admin.CreateRecruiterRequest(
                admin_id=admin_user.id,
                email="rec@example.com",
                password="Secret123",
                company_name="Tech Co",
                full_name="Recruiter One",
            ),
            session,
        )
        recruiters = admin.list_recruiters(admin_user.id, session)

        assert created["recruiter_id"] is not None
        assert created["company_name"] == "Tech Co"
        assert len(recruiters) == 1
        assert recruiters[0]["email"] == "rec@example.com"
    finally:
        session.close()


def test_admin_create_recruiter_rejects_duplicate_email():
    session = _make_session()
    try:
        admin_user = _seed_admin(session)
        payload = admin.CreateRecruiterRequest(
            admin_id=admin_user.id,
            email="rec@example.com",
            password="Secret123",
            company_name="Tech Co",
        )
        admin.create_recruiter(payload, session)

        try:
            admin.create_recruiter(payload, session)
        except HTTPException as exc:
            assert exc.status_code == 400
        else:
            raise AssertionError("Expected duplicate recruiter email to be rejected")
    finally:
        session.close()


def test_admin_routes_reject_non_admin_user():
    session = _make_session()
    try:
        candidate = make_user("candidate@example.com", "candidate")
        session.add(candidate)
        session.commit()
        session.refresh(candidate)

        try:
            admin.admin_overview(candidate.id, session)
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("Expected candidate to be rejected by admin route")
    finally:
        session.close()


def test_admin_overview_counts_core_records():
    session = _make_session()
    try:
        admin_user = _seed_admin(session)
        session.add(make_user("candidate@example.com", "candidate"))
        session.add(make_user("rec@example.com", "recruiter"))
        session.commit()

        overview = admin.admin_overview(admin_user.id, session)

        assert overview["total_candidates"] == 1
        assert overview["total_recruiters"] == 1
        assert overview["total_jobs"] == 0
        assert overview["total_applications"] == 0
    finally:
        session.close()
