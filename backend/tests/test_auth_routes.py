import sys

from fastapi import HTTPException
from sqlmodel import SQLModel, Session, create_engine, select

sys.path.insert(0, '..')

from app.models import User
from app.routes import auth


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def test_candidate_register_and_login_success():
    session = _make_session()
    try:
        registered = auth.register_user(
            auth.UserRegisterRequest(
                email="candidate@example.com",
                password="Secret123",
                role="candidate",
                full_name="Candidate User",
            ),
            session,
        )
        logged_in = auth.login_user(
            auth.UserLoginRequest(email="candidate@example.com", password="Secret123"),
            session,
        )

        assert registered["role"] == "candidate"
        assert logged_in["user_id"] == registered["user_id"]
        assert logged_in["role"] == "candidate"
        assert logged_in["email"] == "candidate@example.com"
    finally:
        session.close()


def test_register_rejects_non_candidate_self_registration():
    session = _make_session()
    try:
        try:
            auth.register_user(
                auth.UserRegisterRequest(
                    email="recruiter@example.com",
                    password="Secret123",
                    role="recruiter",
                ),
                session,
            )
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("Expected non-candidate registration to be rejected")
    finally:
        session.close()


def test_login_rejects_wrong_password():
    session = _make_session()
    try:
        auth.register_user(
            auth.UserRegisterRequest(
                email="candidate@example.com",
                password="Secret123",
                role="candidate",
            ),
            session,
        )

        try:
            auth.login_user(
                auth.UserLoginRequest(email="candidate@example.com", password="WrongPassword"),
                session,
            )
        except HTTPException as exc:
            assert exc.status_code == 400
        else:
            raise AssertionError("Expected wrong password login to be rejected")
    finally:
        session.close()


def test_candidate_profile_update_rejects_non_candidate():
    session = _make_session()
    try:
        recruiter = User(email="rec@example.com", password_hash="hash", role="recruiter")
        session.add(recruiter)
        session.commit()
        session.refresh(recruiter)

        try:
            auth.update_candidate_profile(
                recruiter.id,
                auth.CandidateProfileUpdateRequest(full_name="Not Candidate"),
                session,
            )
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("Expected recruiter profile update through candidate route to be rejected")
    finally:
        session.close()
