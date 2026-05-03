from app.services.matcher import score_cv_vs_jd


def main():
    cv_text = '''
    Nguyễn Văn A
    Skills: Python, Django, PostgreSQL, Docker
    Experience: 6 years building backend systems and APIs
    Projects: Order management system for e-commerce
    Languages: English (fluent)
    '''

    jd_text = '''
    Senior Backend Engineer
    Required: Python, Django, 4+ years experience
    Language: English
    Preferred: Docker, Kubernetes
    '''

    out = score_cv_vs_jd(cv_text, jd_text)
    print(out)


if __name__ == '__main__':
    main()
