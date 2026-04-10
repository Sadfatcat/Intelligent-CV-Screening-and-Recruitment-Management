import os
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from app.database import get_session
from app.models import User
from app.security import get_password_hash, verify_password

# đọc từ .env, nếu không có thì dùng giá trị mặc định
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "admin-secret-2026")

# prefix /api/auth
router = APIRouter(prefix="/api/auth", tags=["auth"])


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "candidate"  # candidate | recruiter
    admin_secret_key: Optional[str] = None  # bắt buộc khi role=recruiter


class UserLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register_user(user_data: UserRegisterRequest, session: Session = Depends(get_session)):
    # chặn tạo recruiter nếu không có key hợp lệ
    if user_data.role == "recruiter":
        if user_data.admin_secret_key != ADMIN_SECRET_KEY:
            raise HTTPException(status_code=403, detail="Sai admin secret key")

    # kiểm tra email đã tồn tại chưa
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký")

    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return {"message": "Đăng ký thành công", "user_id": new_user.id, "role": new_user.role}


@router.post("/login")
def login_user(user_data: UserLoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == user_data.email)).first()

    if not user:
        raise HTTPException(status_code=400, detail="Không tìm thấy tài khoản")

    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Sai mật khẩu")

    return {"message": "Đăng nhập thành công", "user_id": user.id, "role": user.role}
