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


class CandidateProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


@router.post("/register")
def register_user(user_data: UserRegisterRequest, session: Session = Depends(get_session)):
    # workflow mới: candidate tự đăng ký, recruiter do admin tạo
    if user_data.role != "candidate":
        raise HTTPException(status_code=403, detail="Chỉ candidate được tự đăng ký")

    # kiểm tra email đã tồn tại chưa
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký")

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

    return {"message": "Đăng ký thành công", "user_id": new_user.id, "role": new_user.role}


@router.post("/login")
def login_user(user_data: UserLoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user:
        raise HTTPException(status_code=400, detail="Không tìm thấy tài khoản")

    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Sai mật khẩu")

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
        "message": "Đăng nhập thành công",
        "user_id": user.id,
        "role": user.role,
        "email": user.email,
        "company_name": user.company_name,
    }


@router.put("/candidate/{candidate_id}/profile")
def update_candidate_profile(
    candidate_id: int,
    payload: CandidateProfileUpdateRequest,
    session: Session = Depends(get_session),
):
    user = session.get(User, candidate_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
    if user.role != "candidate":
        raise HTTPException(status_code=403, detail="Chỉ candidate được cập nhật hồ sơ cá nhân")

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
        "message": "Cập nhật hồ sơ thành công",
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name,
        "phone": user.phone,
        "address": user.address,
    }
