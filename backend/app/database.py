import os
from pathlib import Path
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Không tìm thấy DATABASE_URL trong .env")

engine = create_engine(DATABASE_URL, echo=True)


def run_startup_migrations():
    statements = [
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS full_name VARCHAR',
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone VARCHAR',
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS address VARCHAR',
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS company_name VARCHAR',
        'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
        "ALTER TABLE job ADD COLUMN IF NOT EXISTS jd_file_path VARCHAR",
        "ALTER TABLE job ADD COLUMN IF NOT EXISTS jd_parsed_text TEXT",
        "ALTER TABLE job ADD COLUMN IF NOT EXISTS jd_vector TEXT",
        "ALTER TABLE job ADD COLUMN IF NOT EXISTS quantity INTEGER",
        "ALTER TABLE job ADD COLUMN IF NOT EXISTS direct_contact VARCHAR",
    ]

    with engine.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))


def ensure_default_admin():
    from sqlmodel import select
    from app.models import User
    from app.security import get_password_hash

    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@cvscreening.local")
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@123")

    with Session(engine) as session:
        admin_user = session.exec(
            select(User).where(User.email == admin_email)
        ).first()
        if admin_user:
            return

        session.add(
            User(
                email=admin_email,
                password_hash=get_password_hash(admin_password),
                role="admin",
                full_name="System Admin",
                is_active=True,
            )
        )
        session.commit()

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    run_startup_migrations()
    ensure_default_admin()