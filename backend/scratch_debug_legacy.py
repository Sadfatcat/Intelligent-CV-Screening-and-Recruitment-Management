import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.extractor import extract_text_from_pdf
from app.services.matcher import score_cv_vs_jd, parse_sections_jd, _extract_demands_from_jd, load_aliases, _load_alias_index

CV_DIR = "/home/dat/Downloads/fake jd/System_Replace_JD_CVs"
jd_filename = "Senior Full Stack Developer | Java／Spring- CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM.pdf"
jd_path = os.path.join(CV_DIR, jd_filename)

with open(jd_path, "rb") as f:
    jd_bytes = f.read()
jd_text = extract_text_from_pdf(jd_bytes)

aliases = load_aliases()
alias_index = _load_alias_index(aliases)
demands = _extract_demands_from_jd(jd_text, alias_index)

print("--- LEGACY DEMANDS ---")
import pprint
pprint.pprint(demands)
