from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: str = "candidate"  # candidate | recruiter | admin
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    is_active: bool = Field(default=True)

    jobs: List["Job"] = Relationship(back_populates="recruiter")
    cvs: List["CV"] = Relationship(back_populates="candidate")


class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    recruiter_id: Optional[int] = Field(default=None, foreign_key="user.id")

    title: str
    company_name: str
    location: str
    level: str
    deadline: str
    image_url: Optional[str] = None
    description: str

    # lưu JD
    jd_file_path: Optional[str] = None
    jd_parsed_text: Optional[str] = None
    jd_vector: Optional[str] = None  # json string của vector 384 chiều

    recruiter: Optional[User] = Relationship(back_populates="jobs")
    applications: List["JobApplication"] = Relationship(back_populates="job")


class CV(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # thông tin cá nhân ứng viên tự điền
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None

    file_path: str  # lưu cv trong ổ cứng
    parsed_text: Optional[str] = None
    cv_vector: Optional[str] = None  # lưu vector cv

    candidate: Optional[User] = Relationship(back_populates="cvs")
    applications: List["JobApplication"] = Relationship(back_populates="cv")


class JobApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: Optional[int] = Field(default=None, foreign_key="job.id")
    cv_id: Optional[int] = Field(default=None, foreign_key="cv.id")

    ai_matching_score: Optional[float] = None
    status: str = Field(default="pending")  # pending | reviewed | accepted | rejected

    job: Optional[Job] = Relationship(back_populates="applications")
    cv: Optional[CV] = Relationship(back_populates="applications")


class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    actor_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    actor_role: str
    action: str
    target_type: str
    target_id: Optional[int] = None
    detail: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)