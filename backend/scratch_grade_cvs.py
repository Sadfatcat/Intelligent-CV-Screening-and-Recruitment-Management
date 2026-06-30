import os
import sys
import json
import fitz

# Add backend directory to path to import app services
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.extractor import extract_text_from_pdf
from app.services.cv_scoring import CvScoringService
from app.services.matcher import score_cv_vs_jd

CV_DIR = "/home/dat/Downloads/fake jd/System_Replace_JD_CVs"

def main():
    # Find JD PDF
    jd_filename = "Senior Full Stack Developer | Java／Spring- CÔNG TY TNHH GEO SYSTEM SOLUTIONS VIỆT NAM.pdf"
    jd_path = os.path.join(CV_DIR, jd_filename)
    
    if not os.path.exists(jd_path):
        print(f"Error: JD file not found at {jd_path}")
        return
        
    print(f"Reading JD from {jd_filename}...")
    with open(jd_path, "rb") as f:
        jd_bytes = f.read()
    jd_text = extract_text_from_pdf(jd_bytes)
    
    # Also parse candidate CVs
    files = sorted(os.listdir(CV_DIR))
    cv_files = [f for f in files if f != jd_filename and f.lower().endswith(".pdf")]
    
    print(f"Found {len(cv_files)} CVs to process:")
    for cv_f in cv_files:
        print(f" - {cv_f}")
        
    results = []
    
    scoring_service = CvScoringService()
    
    for cv_f in cv_files:
        cv_path = os.path.join(CV_DIR, cv_f)
        with open(cv_path, "rb") as f:
            cv_bytes = f.read()
        cv_text = extract_text_from_pdf(cv_bytes)
        
        # Run original matcher logic and hybrid scoring logic (which is returned by score_cv_vs_jd)
        match_res = score_cv_vs_jd(cv_text, jd_text)
        
        results.append({
            "filename": cv_f,
            "finalScore": match_res.get("finalScore"),
            "overall_score": match_res.get("overall_score"),
            "subScores": match_res.get("subScores"),
            "reasoningSummary": match_res.get("reasoningSummary"),
            "matched": match_res.get("matched"),
            "missingOrWeak": match_res.get("missingOrWeak"),
        })
        
    # Write results to output file
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grading_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"\nGrading complete. Results written to {output_path}\n")
    
    # Display summary
    print(f"{'CV Filename':<30} | {'Final Score (0-100)':<20} | {'Overall Score':<15}")
    print("-" * 75)
    for r in results:
        print(f"{r['filename']:<30} | {r['finalScore']:<20} | {r['overall_score']:<15}")

if __name__ == "__main__":
    main()
