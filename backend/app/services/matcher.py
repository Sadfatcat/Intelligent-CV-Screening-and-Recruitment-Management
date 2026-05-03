import json
import os
import re
from typing import Dict, List, Tuple

try:
    # import sklearn lazily; some environments may not have it installed
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    _HAVE_SKLEARN = True
except Exception:
    TfidfVectorizer = None
    cosine_similarity = None
    _HAVE_SKLEARN = False

from app.services.vectorizer import get_model


BASE_DIR = os.path.dirname(__file__)
ALIAS_PATH = os.path.join(BASE_DIR, "skill_aliases.json")
DEFAULT_ALPHA_MAP = {
    "experience": 0.6,
    "projects": 0.9,
    "coding_languages": 0.1,
    "skills": 0.35,
}


def clean_text(text: str) -> str:
    if not text:
        return ""
    t = text.replace("\r", "\n")
    t = re.sub(r"\s+", " ", t)
    t = t.strip().lower()
    return t


def regex_extract(text: str) -> Dict[str, List[str]]:
    out = {"emails": [], "phones": [], "languages": [], "years": [], "months": []}
    if not text:
        return out
    out["emails"] = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    out["phones"] = re.findall(r"(?:\+\d{1,3}[\s-]?)?(?:\d[\d\s-]{6,}\d)", text)
    # naive language detection by keywords
    langs = []
    for lang in ["english", "french", "vietnamese", "german", "spanish"]:
        if re.search(rf"\b{lang}\b", text, flags=re.I):
            langs.append(lang)
    out["languages"] = langs
    years = re.findall(r"(\d+)\s+years", text, flags=re.I)
    months = re.findall(r"(\d+)\s+months", text, flags=re.I)
    out["years"] = years
    out["months"] = months
    return out


def extract_experience_years(text: str) -> float:
    """Estimate experience in years from text by combining years and months."""
    if not text:
        return 0.0

    years = [float(value) for value in re.findall(r"(\d+(?:\.\d+)?)\s+years?", text, flags=re.I)]
    months = [float(value) for value in re.findall(r"(\d+(?:\.\d+)?)\s+months?", text, flags=re.I)]

    total_years = max(years) if years else 0.0
    total_months = (max(months) / 12.0) if months else 0.0
    return total_years + total_months


def _required_experience_years(text: str) -> float:
    if not text:
        return 0.0
    years = re.findall(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", text, flags=re.I)
    if years:
        return float(years[0])
    months = re.findall(r"(\d+(?:\.\d+)?)\s+months?", text, flags=re.I)
    if months:
        return float(months[0]) / 12.0
    return 0.0


def load_aliases() -> Dict[str, List[str]]:
    try:
        with open(ALIAS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def map_skills(raw_skills_text: str, aliases: Dict[str, List[str]]) -> List[str]:
    if not raw_skills_text:
        return []
    cleaned = re.split(r"[,;\n\\|/|•]| and | & ", raw_skills_text)
    cleaned = [c.strip().lower() for c in cleaned if c and c.strip()]
    mapped = set()
    for token in cleaned:
        found = False
        for canon, forms in aliases.items():
            if token == canon or token in forms:
                mapped.add(canon)
                found = True
                break
        if not found:
            mapped.add(token)
    return sorted(mapped)


def _tfidf_cosine(a: str, b: str) -> float:
    if not _HAVE_SKLEARN:
        # fallback: simple Jaccard-like token overlap
        sa = set((a or "").split())
        sb = set((b or "").split())
        if not sa or not sb:
            return 0.0
        inter = sa.intersection(sb)
        union = sa.union(sb)
        return float(len(inter) / len(union))
    try:
        vect = TfidfVectorizer().fit_transform([a or "", b or ""]).toarray()
        if vect.shape[0] < 2:
            return 0.0
        sim = cosine_similarity([vect[0]], [vect[1]])
        return float(sim[0][0])
    except ValueError:
        sa = set((a or "").split())
        sb = set((b or "").split())
        if not sa or not sb:
            return 0.0
        inter = sa.intersection(sb)
        union = sa.union(sb)
        return float(len(inter) / len(union))


def _embed_cosine(a: str, b: str) -> float:
    try:
        model = get_model()
        vecs = model.encode([a or "", b or ""], convert_to_numpy=True)
        sim = cosine_similarity([vecs[0]], [vecs[1]])
        return float(sim[0][0])
    except Exception:
        # fallback to tfidf similarity if embeddings unavailable
        return _tfidf_cosine(a, b)


def section_similarity(text_cv: str, text_jd: str, alpha: float = 0.75) -> float:
    # alpha: weight for embedding similarity, (1-alpha) for tfidf
    embed_sim = _embed_cosine(text_cv, text_jd)
    tfidf_sim = _tfidf_cosine(text_cv, text_jd)
    return float(alpha * embed_sim + (1 - alpha) * tfidf_sim)


DEFAULT_WEIGHTS = {
    "experience": 0.4,
    "projects": 0.15,
    "coding_languages": 0.25,
    "skills": 0.2,
}


def parse_sections_cv(text: str) -> Dict[str, str]:
    t = clean_text(text)
    sections = {"skills": "", "experience": "", "projects": "", "education": "", "certificates": "", "coding_languages": "", "languages": ""}
    # naive heuristics based on headings
    headings = re.split(r"\n{2,}", t)
    for block in headings:
        if re.search(r"skill|technical skill|technologies|stack", block):
            sections["skills"] += " " + block
        elif re.search(r"experience|work experience|employment|professional", block):
            sections["experience"] += " " + block
        elif re.search(r"project|portfolio", block):
            sections["projects"] += " " + block
        elif re.search(r"education|degree|university|school", block):
            sections["education"] += " " + block
        elif re.search(r"certificate|certification", block):
            sections["certificates"] += " " + block
        elif re.search(r"language|english|french|vietnamese|german|spanish", block):
            sections["languages"] += " " + block
        elif re.search(r"python|java|c\+\+|c#|javascript|ts|sql|golang|rust", block):
            sections["coding_languages"] += " " + block
        else:
            # fallback: attach to skills if short, else to experience
            if len(block.split()) < 10:
                sections["skills"] += " " + block
            else:
                sections["experience"] += " " + block
    # strip
    return {k: v.strip() for k, v in sections.items()}


def parse_sections_jd(text: str) -> Dict[str, str]:
    t = clean_text(text)
    sections = {"job_title": "", "required_skills": "", "required_experience": "", "education_requirement": "", "language_requirement": "", "preferred_skills": "", "soft_skills": ""}
    blocks = re.split(r"\n{2,}", t)
    for block in blocks:
        if re.search(r"title|position|role", block):
            sections["job_title"] += " " + block
        if re.search(r"require|must have|required|responsibility|responsibilities", block):
            if re.search(r"year|experience|\d+\s+years", block):
                sections["required_experience"] += " " + block
            if re.search(r"language|english|french", block):
                sections["language_requirement"] += " " + block
            if re.search(r"skill|technology|tech|stack|tool", block):
                sections["required_skills"] += " " + block
        if re.search(r"prefer|nice to have|desired|preferred", block):
            sections["preferred_skills"] += " " + block
        if re.search(r"soft skill|communication|team|collaboration|problem solving", block):
            sections["soft_skills"] += " " + block
        if re.search(r"education|degree|bachelor|master|phd|university", block):
            sections["education_requirement"] += " " + block
    return {k: v.strip() for k, v in sections.items()}


def rule_based_checks(parsed_cv: Dict[str, str], parsed_jd: Dict[str, str], extra: Dict) -> Tuple[List[str], List[str]]:
    # returns (passes, fails)
    passes = []
    fails = []
    # language requirement check
    jd_langs = parsed_jd.get("language_requirement", "")
    if jd_langs:
        cv_langs = parsed_cv.get("languages", "")
        matched = False
        for lang in ["english", "french", "vietnamese", "german", "spanish"]:
            if lang in jd_langs and lang in cv_langs:
                matched = True
                passes.append(f"language:{lang}")
        if not matched:
            fails.append("missing_required_language")
    # skills existence check: every required skill token appears in cv skills text (naive)
    req_skills = parsed_jd.get("required_skills", "")
    if req_skills:
        for token in re.split(r"[,;\n\\|/]| and | & ", req_skills):
            token = token.strip()
            if not token:
                continue
            if re.search(re.escape(token), parsed_cv.get("skills", ""), flags=re.I):
                passes.append(f"skill:{token}")
            else:
                fails.append(f"missing_skill:{token}")

    # experience hard-check: compare estimated years in CV and JD required years
    required_years = _required_experience_years(parsed_jd.get("required_experience", ""))
    candidate_years = extract_experience_years(parsed_cv.get("experience", "") or parsed_cv.get("skills", ""))
    if required_years > 0:
        if candidate_years >= required_years:
            passes.append(f"experience_years:{candidate_years:.2f}")
        else:
            fails.append(f"insufficient_experience:{candidate_years:.2f}<{required_years:.2f}")
    return passes, fails


def score_cv_vs_jd(
    cv_text: str,
    jd_text: str,
    weights: Dict[str, float] = None,
    alpha: float = 0.7,
    alpha_map: Dict[str, float] = None,
) -> Dict:
    aliases = load_aliases()
    parsed_cv = parse_sections_cv(cv_text)
    parsed_jd = parse_sections_jd(jd_text)
    regex_cv = regex_extract(cv_text)
    regex_jd = regex_extract(jd_text)

    if weights is None:
        weights = DEFAULT_WEIGHTS
    if alpha_map is None:
        alpha_map = DEFAULT_ALPHA_MAP

    # compute per-section similarity
    section_scores = {}
    # map CV coding languages: treat coding_languages and skills similarly
    section_scores["experience"] = section_similarity(
        parsed_cv.get("experience", ""),
        parsed_jd.get("required_experience", ""),
        alpha=alpha_map.get("experience", alpha),
    )
    section_scores["projects"] = section_similarity(
        parsed_cv.get("projects", ""),
        parsed_jd.get("preferred_skills", ""),
        alpha=alpha_map.get("projects", alpha),
    )
    section_scores["coding_languages"] = section_similarity(
        parsed_cv.get("coding_languages", ""),
        parsed_jd.get("required_skills", ""),
        alpha=alpha_map.get("coding_languages", alpha),
    )
    section_scores["skills"] = section_similarity(
        parsed_cv.get("skills", ""),
        parsed_jd.get("required_skills", ""),
        alpha=alpha_map.get("skills", alpha),
    )

    # weighted aggregate
    final = 0.0
    total_w = sum(weights.values()) if weights else 1.0
    for k, w in weights.items():
        final += section_scores.get(k, 0.0) * (w / total_w)

    passes, fails = rule_based_checks(parsed_cv, parsed_jd, {})

    if any(fail.startswith("insufficient_experience:") for fail in fails):
        final *= 0.5
    if "missing_required_language" in fails:
        final *= 0.75
    if any(fail.startswith("missing_skill:") for fail in fails):
        final *= 0.85

    mapped_skills = map_skills(parsed_cv.get("skills", ""), aliases)

    return {
        "parsed_cv": parsed_cv,
        "parsed_jd": parsed_jd,
        "regex_cv": regex_cv,
        "regex_jd": regex_jd,
        "mapped_skills": mapped_skills,
        "section_scores": section_scores,
        "passes": passes,
        "fails": fails,
        "final_score": float(final),
        "alpha_map": alpha_map,
    }


if __name__ == "__main__":
    sample_cv = """
    John Doe\n    Skills: Python, Django, Postgres\n    Experience: 5 years building web apps\n    Projects: e-commerce site\n    Languages: English (fluent)\n+    """
    sample_jd = """
    Senior Backend Engineer\n    Required: Python, Django, 3+ years experience\n    Language: English\n    Preferred: Docker, Kubernetes\n+    """
    out = score_cv_vs_jd(sample_cv, sample_jd)
    print(json.dumps(out, indent=2, ensure_ascii=False))
