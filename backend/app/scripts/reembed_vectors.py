import os

from dotenv import load_dotenv
from sqlmodel import Session, create_engine, select

from app.models import CV, Job
from app.services.vectorizer import text_to_vector_json


load_dotenv()


def get_database_url() -> str:
    database_url = os.getenv("REEMBED_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    if "@db:" in database_url:
        return database_url.replace("@db:", "@localhost:")

    return database_url


engine = create_engine(get_database_url())


def reembed_jobs(session: Session) -> int:
    jobs = session.exec(select(Job)).all()
    updated_count = 0

    for job in jobs:
        source_text = job.jd_parsed_text or job.description
        if not source_text:
            continue

        job.jd_vector = text_to_vector_json(source_text)
        session.add(job)
        updated_count += 1

    session.commit()
    return updated_count


def reembed_cvs(session: Session) -> int:
    cvs = session.exec(select(CV)).all()
    updated_count = 0

    for cv in cvs:
        source_text = cv.parsed_text
        if not source_text:
            continue

        cv.cv_vector = text_to_vector_json(source_text)
        session.add(cv)
        updated_count += 1

    session.commit()
    return updated_count


def main() -> None:
    with Session(engine) as session:
        job_count = reembed_jobs(session)
        cv_count = reembed_cvs(session)

    print(f"Re-embedded jobs: {job_count}")
    print(f"Re-embedded CVs: {cv_count}")


if __name__ == "__main__":
    main()