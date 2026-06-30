import os
import sys
import json

# Add backend root directory to sys.path to resolve imports correctly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.cv_scoring import CvScoringService

def run_test():
    # 1. Define sample JD text
    jd_text = """
    We are looking for a Senior Full Stack Developer (Java/Spring) at GEO System Solutions.
    Requirements:
    - 5+ years of experience with Java, Spring Framework, Spring Boot, SQL, HTML, CSS, JavaScript.
    - Experience in retail, POS, and inventory management core system development.
    - Strong skills in system design, technical specification writing, and test case design.
    - Excellent English documentation and Japanese communication/collaboration skills.
    - DevOps knowledge (AWS, Docker, CI/CD) is a plus.
    """

    # 2. Define weak CV: mostly unrelated frontend/WordPress/design experience
    weak_cv = """
    John Doe - UI Designer & WordPress Developer
    Summary: 2 years of experience building simple WordPress landing pages and designing Figma mockups.
    Skills: HTML, CSS, Figma, WordPress, Adobe Photoshop, basic JavaScript.
    Experience:
    - Freelance UI Designer: Designed layout screens for local retail shops.
    - WordPress Creator: Set up basic templates for local portfolio websites. No backend or database experience.
    """

    # 3. Define strong CV: 6+ years Java/Spring, retail/POS/inventory, system design, testing
    strong_cv = """
    Alice Smith - Senior Full Stack Engineer
    Summary: 6 years of professional software engineering experience specializing in enterprise retail applications.
    Technical Skills: Java, Spring Boot, Spring Framework, PostgreSQL, Docker, AWS, CI/CD, React, TypeScript.
    Experience:
    - Tech Lead at RetailCorp (4 years): Designed and implemented the core POS and inventory management system replacement.
      Led a team of 4 developers. Authored detailed technical design specifications.
    - Backend Developer at GlobalTech (2 years): Developed high-throughput REST APIs using Spring Boot.
      Designed test cases, wrote unit/integration tests, and performed code reviews to ensure system stability.
    - Collaborated closely with the Japanese offshore team to define requirements and cross-cultural communication protocols.
      Fluent in English (written technical documentations) and Japanese.
    """

    # 4. Perform scoring
    service = CvScoringService()
    
    print("Scoring Weak CV...")
    weak_result = service.score_cv_vs_jd(weak_cv, jd_text)
    print(json.dumps(weak_result, indent=2, ensure_ascii=False))
    
    print("\nScoring Strong CV...")
    strong_result = service.score_cv_vs_jd(strong_cv, jd_text)
    print(json.dumps(strong_result, indent=2, ensure_ascii=False))

    # 5. Assertions
    print("\nRunning assertions...")
    assert "finalScore" in weak_result, "Weak CV result missing finalScore"
    assert "subScores" in weak_result, "Weak CV result missing subScores"
    assert "matched" in weak_result, "Weak CV result missing matched"
    assert "missingOrWeak" in weak_result, "Weak CV result missing missingOrWeak"
    assert "reasoningSummary" in weak_result, "Weak CV result missing reasoningSummary"

    assert "finalScore" in strong_result, "Strong CV result missing finalScore"
    assert "subScores" in strong_result, "Strong CV result missing subScores"
    assert "matched" in strong_result, "Strong CV result missing matched"
    assert "missingOrWeak" in strong_result, "Strong CV result missing missingOrWeak"
    assert "reasoningSummary" in strong_result, "Strong CV result missing reasoningSummary"

    weak_score = weak_result["finalScore"]
    strong_score = strong_result["finalScore"]

    print(f"Weak CV Score: {weak_score}")
    print(f"Strong CV Score: {strong_score}")

    assert strong_score > weak_score, f"Expected strong score ({strong_score}) to be higher than weak score ({weak_score})"
    assert strong_score >= 75, f"Expected strong score >= 75, got {strong_score}"
    assert weak_score <= 60, f"Expected weak score <= 60, got {weak_score}"

    print("\nAll criteria scoring tests passed successfully!")

if __name__ == "__main__":
    run_test()
