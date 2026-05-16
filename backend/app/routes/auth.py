from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from app.database import get_session
from app.models import User, ActivityLog
from app.security import get_password_hash, verify_password

# prefix /api/auth
router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "candidate"
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str


class CandidateProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


@router.post("/register")
def register_user(user_data: UserRegisterRequest, session: Session = Depends(get_session)):
    # workflow mới: candidate tự đăng ký, recruiter do admin tạo
    if user_data.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can self-register")

    # kiểm tra email đã tồn tại chưa
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered")

    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="candidate",
        full_name=user_data.full_name,
        phone=user_data.phone,
        address=user_data.address,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    session.add(
        ActivityLog(
            actor_user_id=new_user.id,
            actor_role="candidate",
            action="candidate.register",
            target_type="user",
            target_id=new_user.id,
            detail=f"Candidate self-registered: {new_user.email}",
        )
    )
    session.commit()

    return {"message": "Registration successful", "user_id": new_user.id, "role": new_user.role}


@router.post("/login")
def login_user(user_data: UserLoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user:
        raise HTTPException(status_code=400, detail="Account not found")

    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")

    session.add(
        ActivityLog(
            actor_user_id=user.id,
            actor_role=user.role,
            action="user.login",
            target_type="user",
            target_id=user.id,
            detail=f"Login: {user.email}",
        )
    )
    session.commit()

    return {
        "message": "Login successful",
        "user_id": user.id,
        "role": user.role,
        "email": user.email,
        "company_name": user.company_name,
        "must_change_password": user.role == "recruiter" and verify_password("1", user.password_hash),
    }


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, session: Session = Depends(get_session)):
    user = session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can change password in this flow")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    next_password = payload.new_password.strip()
    if len(next_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    if next_password == "1":
        raise HTTPException(status_code=400, detail="New password cannot be the default password")

    user.password_hash = get_password_hash(next_password)
    session.add(user)
    session.commit()

    session.add(
        ActivityLog(
            actor_user_id=user.id,
            actor_role=user.role,
            action="recruiter.password.change",
            target_type="user",
            target_id=user.id,
            detail=f"Recruiter changed password: {user.email}",
        )
    )
    session.commit()

    return {"message": "Password changed successfully"}


@router.put("/candidate/{candidate_id}/profile")
def update_candidate_profile(
    candidate_id: int,
    payload: CandidateProfileUpdateRequest,
    session: Session = Depends(get_session),
):
    user = session.get(User, candidate_id)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can update their profile")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.address is not None:
        user.address = payload.address

    session.add(user)
    session.commit()
    session.refresh(user)

    session.add(
        ActivityLog(
            actor_user_id=user.id,
            actor_role="candidate",
            action="candidate.profile.update",
            target_type="user",
            target_id=user.id,
            detail="Candidate updated profile",
        )
    )
    session.commit()

    return {
        "message": "Profile updated successfully",
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name,
        "phone": user.phone,
        "address": user.address,
    }
