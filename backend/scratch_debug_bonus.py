import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.extractor import extract_text_from_pdf
from app.services.cv_scoring import KeywordMatcher, ScoringWeightsConfig

CV_DIR = "/home/dat/Downloads/fake jd/System_Replace_JD_CVs"
cv_filename = "Lê_Minh_Khoa_98.pdf"
cv_path = os.path.join(CV_DIR, cv_filename)

with open(cv_path, "rb") as f:
    cv_bytes = f.read()
cv_text = extract_text_from_pdf(cv_bytes)

config = ScoringWeightsConfig()
matcher = KeywordMatcher(config.SYNONYM_DICT)

bonus_skills = ['aws', 'docker', 'kubernetes', 'ci/cd', 'redis', 'kafka', 'performance tuning', 'security', 'oauth2', 'jwt', 'playwright']

for skill in bonus_skills:
    matched = matcher._match_term(skill, cv_text)
    print(f"{skill}: {matched}")
    
print("\nNormalized CV text snippet:")
print(matcher._normalize(cv_text)[:500])
