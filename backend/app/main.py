from fastapi import FastAPI
from app.database import create_db_and_tables
from app import models

app = FastAPI(title="Intelligent CV Screening API")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}