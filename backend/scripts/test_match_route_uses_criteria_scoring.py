import os
import sys

# Add backend directory to sys.path to enable imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

def run_test():
    client = TestClient(app)
    
    # Define sample JD text
    jd_text = """
    We are looking for a Senior Full Stack Developer (Java/Spring) at GEO System Solutions.
    Requirements:
    - 5+ years of experience with Java, Spring Framework, Spring Boot, SQL, HTML, CSS, JavaScript.
    - Experience in retail, POS, and inventory management core system development.
    - Strong skills in system design, technical specification writing, and test case design.
    - Excellent English documentation and Japanese communication/collaboration skills.
    - DevOps knowledge (AWS, Docker, CI/CD) is a plus.
    """

    # Define weak CV: mostly unrelated frontend/WordPress/design experience
    weak_cv = """
    John Doe - UI Designer & WordPress Developer
    Summary: 2 years of experience building simple WordPress landing pages and designing Figma mockups.
    Skills: HTML, CSS, Figma, WordPress, Adobe Photoshop, basic JavaScript.
    Experience:
    - Freelance UI Designer: Designed layout screens for local retail shops.
    - WordPress Creator: Set up basic templates for local portfolio websites. No backend or database experience.
    """

    # Define strong CV: 6+ years Java/Spring, retail/POS/inventory, system design, testing
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

    print("Sending Request for Weak CV...")
    weak_response = client.post(
        "/match/cv_vs_jd_text",
        data={"cv_text": weak_cv, "jd_text": jd_text, "alpha": 0.7}
    )
    assert weak_response.status_code == 200, f"Weak CV request failed with status: {weak_response.status_code}, detail: {weak_response.text}"
    weak_data = weak_response.json()
    
    print("Sending Request for Strong CV...")
    strong_response = client.post(
        "/match/cv_vs_jd_text",
        data={"cv_text": strong_cv, "jd_text": jd_text, "alpha": 0.7}
    )
    assert strong_response.status_code == 200, f"Strong CV request failed with status: {strong_response.status_code}, detail: {strong_response.text}"
    strong_data = strong_response.json()

    # Assert response contains required fields
    required_fields = [
        "finalScore",
        "final_score",
        "subScores",
        "section_scores",
        "matched",
        "missingOrWeak",
        "reasoningSummary",
        "scoringEngine"
    ]
    for field in required_fields:
        assert field in weak_data, f"Field '{field}' missing from Weak CV response"
        assert field in strong_data, f"Field '{field}' missing from Strong CV response"

    # Assert scoringEngine
    assert weak_data["scoringEngine"] == "criteria_based_v2", f"Expected scoringEngine 'criteria_based_v2', got {weak_data['scoringEngine']}"
    assert strong_data["scoringEngine"] == "criteria_based_v2", f"Expected scoringEngine 'criteria_based_v2', got {strong_data['scoringEngine']}"

    # Assert strong CV finalScore > weak CV finalScore
    weak_score = weak_data["finalScore"]
    strong_score = strong_data["finalScore"]
    print(f"Weak CV Score: {weak_score}")
    print(f"Strong CV Score: {strong_score}")
    
    assert strong_score > weak_score, f"Expected strong score ({strong_score}) to be higher than weak score ({weak_score})"

    print("\nAPI-level match route criteria scoring test passed successfully!")

if __name__ == "__main__":
    run_test()
