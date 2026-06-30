import sys

sys.path.insert(0, '..')

from app.services.matcher import extract_experience_years, score_cv_vs_jd


GEO_SENIOR_JAVA_SPRING_JD = """
Senior Full Stack Developer | Java/Spring - GEO System Solutions Vietnam

Requirements:
- 5+ years of experience with Java, Spring Framework, Spring Boot, SQL, HTML, CSS, JavaScript, TypeScript.
- Experience in retail, POS, inventory management, reuse business, and core system replacement projects.
- Strong system design, implementation, API specification, technical specification, and test design/documentation.
- Experience with system test scenarios, JUnit, Mockito, API testing, and SonarQube.
- Collaboration with Japan-side teams and strong English documentation skills.
- Technical lead / module lead / mentoring experience is preferred.
- AWS, Docker, Kubernetes, Kafka, Redis, CI/CD are pluses.
"""

LE_MINH_KHOA_CV = """
Le Minh Khoa
Senior Full Stack Developer

Summary:
- 11年の経験 in enterprise software development with Java/Spring full stack systems.
- Technical lead / module lead mentoring developers in large delivery teams.

Technical Skills:
Java, Spring Framework, Spring Boot, Spring Security, HTML, CSS, JavaScript, TypeScript, SQL,
JUnit, Mockito, SonarQube, REST API, AWS, Docker, Kubernetes, Kafka, Redis, CI/CD

Experience:
- GEO-related retail platform modernization: designed and implemented Java/Spring Boot services for 小売 and リユース business.
- Led 基幹システム刷新 with POS連携 and 在庫 management modules for reuse business and store operations.
- Designed 英語設計書, 英語の基本設計書, 基本設計書, 詳細設計書, API仕様書, and テスト設計書.
- Created テスト設計, システムテストシナリオ, 品質・テスト自動化フレームワーク, 結合テスト, APIテスト, and コードレビュー flows with JUnit, Mockito, and SonarQube.
- Worked with 日本側 and 日本チーム stakeholders, wrote English design/API/test documentation, and handled cross-border delivery.
- Built backend and frontend features with Java, Spring Boot, HTML, CSS, JavaScript, and TypeScript.
- Performed 設計, 実装, 作成, 最適化, 連携, and 指導 across business-critical modules.
- Supported large data processing and enterprise system replacement in production.

Certificates:
- JLPT N3
- TOEIC 900
"""

TRAN_MINH_DUC_STYLE_WEAK_CV = """
Trần Minh Đức
Position: Full Stack Web Developer
Total Experience: 5 years

Technical Skills:
- Primary Stack: PHP (Laravel), Node.js (Express), JavaScript, MySQL.
- Other Skills: HTML, CSS, Git, basic Spring Boot.

Work Experience:
- Web Developer at WebTech Co (3 years): Built several web applications using Laravel (PHP) and Node.js/Express. Wrote REST APIs and query optimization.
- Software Engineer at RetailShop (2 years): Maintained and expanded their e-commerce web platform. Handled HTML/CSS templates, MySQL queries.
  Note: mostly PHP/Node.js, no direct POS integration.

Personal Projects:
- Spring Boot training app: Built a simple CRUD inventory system as an internal learning project.
  Basic Java/Spring, not yet used in production. Self-evaluation: 98/100 fit for senior Java roles.
"""


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
    assert "sections" in out
    assert "good_points" in out
    assert "missing_points" in out
    assert "must_have" in out
    assert "summary" in out
    assert isinstance(out["finalScore"], (int, float))
    assert 0.0 <= out["finalScore"] <= 100.0
    assert "required_skills" in out["subScores"]
    assert "project_domain" in out["subScores"]
    assert isinstance(out["sections"], list)


def test_extract_experience_years_supports_japanese_year_expressions():
    assert extract_experience_years("11年の経験") == 11.0
    assert extract_experience_years("5年以上のJava経験") == 5.0
    assert extract_experience_years("6年") == 6.0


def test_geo_senior_java_spring_strong_cv_scores_above_85():
    out = score_cv_vs_jd(LE_MINH_KHOA_CV, GEO_SENIOR_JAVA_SPRING_JD)
    assert out["finalScore"] >= 85.0, f"Expected Le Minh Khoa CV to score >= 85, got {out['finalScore']}"
    assert out["subScores"]["testing_documentation"] >= 80.0, (
        f"Expected Le Minh Khoa testing_documentation >= 80, got {out['subScores']['testing_documentation']}"
    )
    assert "missing testing or documentation experience" not in out["reasoningSummary"].lower()
    assert "english design/api/test documentation" in out["reasoningSummary"].lower()
    assert "system testing and qa automation" in out["reasoningSummary"].lower()


def test_geo_senior_java_spring_weak_java_training_cv_stays_below_60():
    out = score_cv_vs_jd(TRAN_MINH_DUC_STYLE_WEAK_CV, GEO_SENIOR_JAVA_SPRING_JD)
    assert out["finalScore"] < 60.0, f"Expected weak Tran Minh Duc-style CV to stay below 60, got {out['finalScore']}"


def test_geo_senior_java_spring_strong_cv_outscores_weak_cv():
    strong_out = score_cv_vs_jd(LE_MINH_KHOA_CV, GEO_SENIOR_JAVA_SPRING_JD)
    weak_out = score_cv_vs_jd(TRAN_MINH_DUC_STYLE_WEAK_CV, GEO_SENIOR_JAVA_SPRING_JD)
    assert strong_out["finalScore"] > weak_out["finalScore"]


def test_self_declared_fit_score_does_not_override_evidence_based_score():
    out = score_cv_vs_jd(TRAN_MINH_DUC_STYLE_WEAK_CV, GEO_SENIOR_JAVA_SPRING_JD)
    assert out["finalScore"] < 60.0, f"Expected evidence-based score to ignore self-declared 98/100, got {out['finalScore']}"


if __name__ == '__main__':
    test_score_basic_shape_and_range()
    test_technical_skill_exact_match_and_missing_case()
    test_alias_matching_case_if_alias_file_exists()
    test_experience_match_and_rule_pass()
    test_must_have_matched_missing_and_capped_penalty()
    test_alpha_map_is_returned_but_score_is_public_scale()
    test_hybrid_scoring_new_fields()
    test_extract_experience_years_supports_japanese_year_expressions()
    test_geo_senior_java_spring_strong_cv_scores_above_85()
    test_geo_senior_java_spring_weak_java_training_cv_stays_below_60()
    test_geo_senior_java_spring_strong_cv_outscores_weak_cv()
    test_self_declared_fit_score_does_not_override_evidence_based_score()
    print('tests passed')
