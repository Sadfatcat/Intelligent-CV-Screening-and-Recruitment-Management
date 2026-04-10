from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import User, Job, CV, JobApplication
from app.database import create_db_and_tables
from app.routes import auth, jobs, cvs


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan, title="Intelligent CV Screening API", version="1.0.0")

# mở cổng cho frontend gọi được
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(cvs.router)


@app.get("/")
def root():
    return {"message": "backend đang chạy"}


@app.get("/health")
def health():
    return {"status": "ok"}