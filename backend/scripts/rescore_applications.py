import os
import sys
import json
import argparse
from sqlmodel import Session, select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.models import JobApplication, Job, CV
from app.services.matching_config import parse_matching_config
from app.services.cv_scoring import CvScoringService

def rescore_all(dry_run: bool = False):
    print(f"Starting rescoring of applications (dry_run={dry_run})...")
    with Session(engine) as session:
        applications = session.exec(select(JobApplication)).all()
        print(f"Found {len(applications)} applications in database.")
        
        updated_count = 0
        for app in applications:
            job = session.get(Job, app.job_id)
            cv = session.get(CV, app.cv_id)
            if not job or not cv:
                print(f"Skipping Application ID={app.id}: Job or CV missing (Job ID={app.job_id}, CV ID={app.cv_id})")
                continue
                
            if not job.jd_parsed_text or not cv.parsed_text:
                print(f"Skipping Application ID={app.id}: jd_parsed_text or cv.parsed_text missing")
                continue
                
            config = parse_matching_config(job.matching_config, strict=False)
            custom_weights = config.get("weights")
            scoring_service = CvScoringService()
            
            try:
                raw_result = scoring_service.score_cv_vs_jd(
                    cv_text=cv.parsed_text,
                    jd_text=job.jd_parsed_text,
                    custom_weights=custom_weights
                )
                
                final_score_100 = float(raw_result.get("finalScore", 0))
                sub_scores_100 = raw_result.get("subScores", {})
                
                matching_detail = {
                    **raw_result,
                    "finalScore": final_score_100,
                    "final_score": round(final_score_100 / 100, 4),
                    "overall_score": round(final_score_100 / 100, 4),
                    "subScores": sub_scores_100,
                    "section_scores": {
                        key: round(float(value) / 100, 4)
                        for key, value in sub_scores_100.items()
                    },
                    "scoringEngine": "criteria_based_v2",
                }
                
                old_score = app.ai_matching_score
                new_score = final_score_100
                
                print(f"Application ID={app.id} (Candidate: {cv.candidate_name or 'Unknown'}, Job: {job.title}): Score {old_score} -> {new_score}")
                
                if not dry_run:
                    app.ai_matching_score = new_score
                    app.matching_detail = json.dumps(matching_detail, ensure_ascii=False)
                    session.add(app)
                updated_count += 1
            except Exception as e:
                print(f"Error rescoring Application ID={app.id}: {e}")
                
        if not dry_run and updated_count > 0:
            session.commit()
            print(f"Successfully rescored and updated {updated_count} applications in the database.")
        else:
            print(f"Processed {updated_count} applications (No DB updates performed).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rescore job applications in database.")
    parser.add_argument("--dry-run", action="store_true", help="Print scores without saving to database.")
    args = parser.parse_args()
    rescore_all(dry_run=args.dry_run)
