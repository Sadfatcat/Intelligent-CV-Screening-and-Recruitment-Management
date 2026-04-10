from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import User, Job, CV, JobApplication
from app.database import create_db_and_tables
from app.routes import auth, admin, recruiter

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan, title="Intelligent CV Screening API", version="1.0.0")

# mo cong cho frontend goi duoc
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# auth luon kha dung de login/register khong bi phu thuoc vao OCR/vector libs
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(recruiter.router)

# jobs/cvs phu thuoc them thu vien xu ly file va ML; neu thieu thi bo qua thay vi lam sap toan bo API
try:
    from app.routes import jobs, cvs

    app.include_router(jobs.router)
    app.include_router(cvs.router)
except Exception as exc:  # pragma: no cover
    logger.exception("Skip loading jobs/cvs routes due to import error: %s", exc)


@app.get("/")
def root():
    return {"message": "backend dang chay"}


@app.get("/health")
def health():
    return {"status": "ok"}
