import sys

sys.path.insert(0, '..')

from app.services.matcher import score_cv_vs_jd


def _section(out, key):
    return next(section for section in out["sections"] if section["key"] == key)


def test_score_basic_shape_and_range():
    cv = """
    Alice
    Skills: Python, FastAPI, PostgreSQL
    Experience: 4 years building backend APIs
    Projects: REST API ecommerce project
    Languages: English
    """
    jd = """
    Backend Engineer
    Requirements: Python, FastAPI, PostgreSQL, 3+ years backend experience
    Language: English
    Responsibilities: Build REST APIs
    """
    out = score_cv_vs_jd(cv, jd)

    assert isinstance(out, dict)
    assert "final_score" in out
    assert "overall_score" in out
    assert out["final_score"] == out["overall_score"]
    assert 0.0 <= out["final_score"] <= 100.0
    assert out["score_scale"] == "0-100"
    assert "section_scores" in out
    assert "technical_skills" in out["section_scores"]
    assert "good_points" in out
    assert "missing_points" in out
    assert isinstance(out["good_points"], list)
    assert isinstance(out["missing_points"], list)
    assert "english" in out["regex_cv"]["languages"]


def test_technical_skill_exact_match_and_missing_case():
    cv = """
    Skills: Python, FastAPI, PostgreSQL
    Experience: 4 years backend developer
    """
    jd = """
    Requirements: Python, FastAPI, Docker, PostgreSQL
    """
    out = score_cv_vs_jd(cv, jd, must_have=["Python", "Docker"])
    technical = _section(out, "technical_skills")

    assert "python matched" in technical["good"]
    assert "fastapi matched" in technical["good"]
    assert "docker missing" in technical["missing"]
    assert "Python" in out["must_have"]["matched"]
    assert "Docker" in out["must_have"]["missing"]


def test_alias_matching_case_if_alias_file_exists():
    cv = """
    Skills: Python, Postgres, k8s
    Experience: 4 years backend developer
    """
    jd = """
    Requirements: PostgreSQL, Kubernetes
    """
    out = score_cv_vs_jd(cv, jd)
    technical = _section(out, "technical_skills")

    assert "postgresql matched" in technical["good"]
    assert "kubernetes matched" in technical["good"]


def test_experience_match_and_rule_pass():
    cv = """
    Experience: 4 years backend developer building APIs
    Skills: Python
    """
    jd = """
    Requirements: Python, 3 years backend experience
    """
    out = score_cv_vs_jd(cv, jd)

    assert any(item.startswith("experience_years:") for item in out["passes"])
    experience = _section(out, "experience")
    assert any("4 years experience found" == item for item in experience["good"])


def test_structured_experience_years_and_preferred_sections():
    cv = """
    Skills: React, TypeScript, CSS, REST API
    Experience years: 2
    Education: Bachelor of Software Engineering
    Languages: English
    Projects: Built responsive UI with React
    """
    jd = """
    Required skills: React, TypeScript, CSS, REST API
    Preferred skills: Playwright
    Required experience years: 1 years
    Education requirement: Bachelor in Computer Science or equivalent experience
    Language requirements: English
    Responsibilities: Build responsive UI; Integrate REST APIs
    """
    out = score_cv_vs_jd(cv, jd)
    experience = _section(out, "experience")
    technical = _section(out, "technical_skills")

    assert "2 years experience found" in experience["good"]
    assert "Preferred 1 years missing" not in experience["missing"]
    assert "Preferred English missing" not in technical["missing"]
    assert out["final_score"] >= 70


def test_must_have_matched_missing_and_capped_penalty():
    cv = """
    Skills: Python
    Experience: 2 years backend developer
    """
    jd = """
    Requirements: Python, Docker, Kubernetes, SQL
    """
    out = score_cv_vs_jd(cv, jd, must_have=["Python", "Docker", "Kubernetes", "SQL"])

    assert "Python" in out["must_have"]["matched"]
    assert "Docker" in out["must_have"]["missing"]
    assert "Kubernetes" in out["must_have"]["missing"]
    assert "SQL" in out["must_have"]["missing"]
    assert out["must_have"]["penalty_applied"] <= 20.0
    assert 0.0 <= out["final_score"] <= 100.0


def test_alpha_map_is_returned_but_score_is_public_scale():
    out = score_cv_vs_jd(
        "Skills: Python\nExperience: 5 years\nLanguages: English",
        "Requirements: Python, 3 years experience\nLanguage: English",
        alpha_map={"experience": 0.2},
    )

    assert out["alpha_map"]["experience"] == 0.2
    assert 0.0 <= out["final_score"] <= 100.0


def test_hybrid_scoring_new_fields():
    cv = """
    Alice
    Skills: Java, Spring Boot, HTML, CSS, JavaScript, SQL
    Experience: 4 years backend developer building retail store operation systems
    Projects: POS inventory system with designed technical specifications and test case design
    Languages: English
    """
    jd = """
    Requirements: Java, Spring Boot, 3+ years experience
    Responsibilities: Develop retail store operation system, design technical specification, perform test case design
    """
    out = score_cv_vs_jd(cv, jd)

    assert "finalScore" in out
    assert "subScores" in out
    assert "matched" in out
    assert "missingOrWeak" in out
    assert "reasoningSummary" in out
    assert isinstance(out["finalScore"], (int, float))
    assert 0.0 <= out["finalScore"] <= 100.0
    assert "required_skills" in out["subScores"]
    assert "project_domain" in out["subScores"]


if __name__ == '__main__':
    test_score_basic_shape_and_range()
    test_technical_skill_exact_match_and_missing_case()
    test_alias_matching_case_if_alias_file_exists()
    test_experience_match_and_rule_pass()
    test_must_have_matched_missing_and_capped_penalty()
    test_alpha_map_is_returned_but_score_is_public_scale()
    test_hybrid_scoring_new_fields()
    print('tests passed')
