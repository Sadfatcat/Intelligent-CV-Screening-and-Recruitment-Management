import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.extractor import extract_text_from_pdf
from app.services.cv_scoring import CvScoringService

CV_DIR = "/home/dat/Downloads/fake jd/System_Replace_JD_CVs"
jd_filename = "Senior Full Stack Developer | Java／Spring- CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM.pdf"
jd_path = os.path.join(CV_DIR, jd_filename)

if not os.path.exists(jd_path):
    print(f"Error: JD file not found at {jd_path}")
    sys.exit(1)

with open(jd_path, "rb") as f:
    jd_bytes = f.read()
jd_text = extract_text_from_pdf(jd_bytes)

print("--- JD TEXT ---")
print(jd_text[:1000])
print("...")

scoring_service = CvScoringService()
demands = scoring_service.parse_demands_from_text(jd_text)
print("--- DEMANDS ---")
import pprint
pprint.pprint(demands)
