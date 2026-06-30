import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.extractor import extract_text_from_pdf
from app.services.cv_scoring import CvScoringService, _extract_stack_experience_years, extract_experience_years, _required_experience_years

CV_DIR = "/home/dat/Downloads/fake jd/System_Replace_JD_CVs"
jd_filename = "Senior Full Stack Developer | Java／Spring- CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM.pdf"
jd_path = os.path.join(CV_DIR, jd_filename)

with open(jd_path, "rb") as f:
    jd_bytes = f.read()
jd_text = extract_text_from_pdf(jd_bytes)

def debug_cv(cv_filename):
    cv_path = os.path.join(CV_DIR, cv_filename)
    if not os.path.exists(cv_path):
        print(f"File not found: {cv_filename}")
        return
    with open(cv_path, "rb") as f:
        cv_bytes = f.read()
    cv_text = extract_text_from_pdf(cv_bytes)
    
    print(f"\n================ DEBUGGING {cv_filename} ================")
    
    req_years = _required_experience_years(jd_text)
    total_years = extract_experience_years(cv_text)
    stack_years = _extract_stack_experience_years(cv_text, jd_text)
    
    print(f"Required experience years: {req_years}")
    print(f"Candidate total experience years: {total_years}")
    print(f"Candidate stack experience years: {stack_years}")
    
    scoring_service = CvScoringService()
    res = scoring_service.score_cv_vs_jd(cv_text, jd_text)
    print("SubScores:")
    for k, v in res["subScores"].items():
        print(f"  {k}: {v}")
    print(f"Final Score: {res['finalScore']}")
    
    # Let's see what keywords matched and missed for required_skills
    print("Required Skills Matched:")
    print(f"  {res['matched']['required_skills']}")
    print("Required Skills Missing:")
    print(f"  {res['missingOrWeak']['required_skills']}")

debug_cv("Lê_Minh_Khoa_98.pdf")
debug_cv("Le_Minh_Khoa_98_JP.pdf")
