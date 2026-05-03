import sys
sys.path.insert(0, '..')

from app.services.matcher import score_cv_vs_jd


def test_score_basic():
    cv = """
    Alice
    Skills: Python, Flask, PostgreSQL
    Experience: 4 years building APIs
    Languages: English
    """
    jd = """
    Backend Engineer
    Required: Python, 3+ years experience
    Language: English
    """
    out = score_cv_vs_jd(cv, jd)
    assert isinstance(out, dict)
    assert 'final_score' in out
    assert 0.0 <= out['final_score'] <= 1.0
    # language should be detected in regex
    assert 'english' in out['regex_cv']['languages']


def test_missing_language_fails():
    cv = """
    Bob
    Skills: Java, Spring
    Experience: 5 years
    """
    jd = """
    Backend Engineer
    Required: Java, 3+ years experience
    Language: English
    """
    out = score_cv_vs_jd(cv, jd)
    assert 'missing_required_language' in out['fails']


def test_insufficient_experience_fails():
    cv = """
    Carol
    Skills: Python, FastAPI
    Experience: 3 months building APIs
    Languages: English
    """
    jd = """
    Backend Engineer
    Required: Python, 3 years experience
    Language: English
    """
    out = score_cv_vs_jd(cv, jd)
    assert any(item.startswith('insufficient_experience:') for item in out['fails'])


def test_alpha_map_is_used():
    cv = """
    Dan
    Projects: built payment service
    Skills: Python
    Experience: 5 years
    Languages: English
    """
    jd = """
    Backend Engineer
    Required: Python, 3 years experience
    Language: English
    Preferred: payment platform
    """
    out = score_cv_vs_jd(cv, jd, alpha_map={"projects": 0.1, "skills": 0.9, "experience": 0.2, "coding_languages": 0.1})
    assert out['alpha_map']['projects'] == 0.1


if __name__ == '__main__':
    test_score_basic()
    test_missing_language_fails()
    test_insufficient_experience_fails()
    test_alpha_map_is_used()
    print('tests passed')
