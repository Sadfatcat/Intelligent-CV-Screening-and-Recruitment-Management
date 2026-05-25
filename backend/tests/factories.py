from app.models import User
from app.security import get_password_hash


def make_user(email: str, role: str, password: str = "Secret123", **kwargs) -> User:
    return User(
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        **kwargs,
    )
