import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.extractor import extract_text_from_pdf

CV_DIR = "/home/dat/Downloads/fake jd/System_Replace_JD_CVs"
jd_filename = "Senior Full Stack Developer | Java／Spring- CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM.pdf"
jd_path = os.path.join(CV_DIR, jd_filename)

with open(jd_path, "rb") as f:
    jd_bytes = f.read()
jd_text = extract_text_from_pdf(jd_bytes)

print("--- Matches for numbers near 'năm' or 'year' or 'experience' ---")
for line in jd_text.splitlines():
    if any(w in line.lower() for w in ["năm", "year", "kinh nghiệm", "exp"]):
        print(line)
