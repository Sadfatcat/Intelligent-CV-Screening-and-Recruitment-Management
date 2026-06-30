import json
import os
import re
from typing import Dict, List, Tuple

try:
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
    "experience": 0.75,
    "technical_skills": 0.30,
    "programming_languages": 0.10,
    "responsibilities": 0.80,
    "projects": 0.80,
    "education": 0.40,
    "certificates": 0.20,
    "natural_languages": 0.10,
    "soft_skills": 0.75,
}

DEFAULT_WEIGHTS = {
    "experience": 0.25,
    "technical_skills": 0.25,
    "programming_languages": 0.15,
    "responsibilities": 0.10,
    "projects": 0.10,
    "education": 0.05,
    "certificates": 0.04,
    "natural_languages": 0.04,
    "soft_skills": 0.02,
}

SECTION_LABELS = {
    "experience": "Experience",
    "technical_skills": "Technical Skills",
    "programming_languages": "Programming Languages",
    "responsibilities": "Responsibilities",
    "projects": "Projects",
    "education": "Education",
    "certificates": "Certificates",
    "natural_languages": "Natural Languages",
    "soft_skills": "Soft Skills",
}

INTERNAL_SECTION_KEYS = set(SECTION_LABELS) | {"requirements", "preferred", "summary", "ignored"}

HEADING_PHRASE_MAP = {
    "required qualifications": "requirements",
    "minimum qualifications": "requirements",
    "basic qualifications": "requirements",
    "mandatory qualifications": "requirements",
    "essential qualifications": "requirements",
    "required skills": "requirements",
    "required skill": "requirements",
    "required experience": "requirements",
    "required experience years": "experience",
    "experience years": "experience",
    "required competencies": "requirements",
    "minimum requirements": "requirements",
    "minimum skills": "requirements",
    "must have": "requirements",
    "must-have skills": "requirements",
    "must have skills": "requirements",
    "what you need": "requirements",
    "what we require": "requirements",
    "what we're looking for": "requirements",
    "what we are looking for": "requirements",
    "ideal candidate": "requirements",
    "ideal candidate profile": "requirements",
    "candidate requirements": "requirements",
    "position requirements": "requirements",
    "job requirements": "requirements",
    "role requirements": "requirements",
    "qualifications": "requirements",
    "requirements": "requirements",
    "preferred qualifications": "preferred",
    "preferred skill": "preferred",
    "nice to have": "preferred",
    "nice-to-have": "preferred",
    "nice-to-have skills": "preferred",
    "nice to have skills": "preferred",
    "bonus qualifications": "preferred",
    "bonus points": "preferred",
    "desired qualifications": "preferred",
    "desired skills": "preferred",
    "desired experience": "preferred",
    "preferred skills": "preferred",
    "preferred experience": "preferred",
    "additional qualifications": "preferred",
    "additional skills": "preferred",
    "would be a plus": "preferred",
    "good to have": "preferred",
    "good-to-have": "preferred",
    "optional skills": "preferred",
    "what you will do": "responsibilities",
    "what you'll do": "responsibilities",
    "responsibilities": "responsibilities",
    "your responsibilities": "responsibilities",
    "key responsibilities": "responsibilities",
    "core responsibilities": "responsibilities",
    "role responsibilities": "responsibilities",
    "job responsibilities": "responsibilities",
    "the role": "responsibilities",
    "about the role": "responsibilities",
    "role overview": "responsibilities",
    "role description": "responsibilities",
    "job description": "responsibilities",
    "position overview": "responsibilities",
    "about the job": "responsibilities",
    "in this role": "responsibilities",
    "day to day": "responsibilities",
    "day-to-day": "responsibilities",
    "duties": "responsibilities",
    "key duties": "responsibilities",
    "tasks": "responsibilities",
    "core strengths": "technical_skills",
    "tech stack": "technical_skills",
    "technical skills": "technical_skills",
    "technical expertise": "technical_skills",
    "technical competencies": "technical_skills",
    "technical requirements": "technical_skills",
    "technology stack": "technical_skills",
    "technologies": "technical_skills",
    "tools and technologies": "technical_skills",
    "tools & technologies": "technical_skills",
    "tools and frameworks": "technical_skills",
    "skills and technologies": "technical_skills",
    "skills & technologies": "technical_skills",
    "key skills": "technical_skills",
    "core skills": "technical_skills",
    "skills": "technical_skills",
    "expertise": "technical_skills",
    "competencies": "technical_skills",
    "stack": "technical_skills",
    "profile snapshot": "summary",
    "experience summary": "experience",
    "profile": "summary",
    "professional profile": "summary",
    "professional summary": "summary",
    "career summary": "summary",
    "summary": "summary",
    "about me": "summary",
    "career overview": "summary",
    "candidate summary": "summary",
    "candidate profile": "summary",
    "background": "summary",
    "professional background": "summary",
    "objective": "summary",
    "snapshot": "summary",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    "work history": "experience",
    "career history": "experience",
    "relevant experience": "experience",
    "selected projects and skills": "projects",
    "selected projects": "projects",
    "projects": "projects",
    "key projects": "projects",
    "notable projects": "projects",
    "featured projects": "projects",
    "personal projects": "projects",
    "open source projects": "projects",
    "open-source projects": "projects",
    "portfolio": "projects",
    "project highlights": "projects",
    "education": "education",
    "education requirement": "education",
    "education requirements": "education",
    "educational background": "education",
    "academic background": "education",
    "academic qualifications": "education",
    "degrees": "education",
    "university": "education",
    "college": "education",
    "certifications": "certificates",
    "certificates": "certificates",
    "professional certifications": "certificates",
    "professional certificates": "certificates",
    "licenses and certifications": "certificates",
    "training": "certificates",
    "courses": "certificates",
    "languages": "natural_languages",
    "language": "natural_languages",
    "language requirement": "natural_languages",
    "language requirements": "natural_languages",
    "spoken languages": "natural_languages",
    "language skills": "natural_languages",
    "foreign languages": "natural_languages",
    "soft skills": "soft_skills",
    "interpersonal skills": "soft_skills",
    "communication skills": "soft_skills",
    "leadership skills": "soft_skills",
    "personal attributes": "soft_skills",
    "what you bring": "soft_skills",
    "about us": "ignored",
    "about the company": "ignored",
    "about the team": "ignored",
    "who we are": "ignored",
    "benefits": "ignored",
    "benefits and work location": "ignored",
    "work location": "ignored",
    "location": "ignored",
    "level": "ignored",
    "keywords": "ignored",
    "role category": "ignored",
}

SECTION_SYNONYMS = {
    "summary": ["summary", "objective", "profile", "professional summary", "tóm tắt", "mục tiêu"],
    "technical_skills": ["skills", "skill", "technical skill", "technical skills", "competencies", "technologies", "stack", "tools"],
    "experience": ["experience", "work experience", "work history", "employment", "professional", "kinh nghiệm", "quá trình làm việc"],
    "projects": ["project", "projects", "portfolio", "highlights", "personal projects", "dự án"],
    "education": ["education", "degree", "university", "school", "academic", "học vấn", "trình độ học vấn"],
    "natural_languages": ["language", "languages", "foreign languages", "ngôn ngữ", "ngoại ngữ"],
    "certificates": ["certificate", "certification", "certificates", "chứng chỉ"],
    "soft_skills": ["soft skill", "communication", "teamwork", "problem solving", "collaboration", "kỹ năng mềm"],
    "responsibilities": ["responsibilities", "responsibility", "tasks", "duties", "what you will do", "job description"],
    "requirements": ["requirements", "required", "must have", "qualification", "qualifications"],
}

STRICT_SECTIONS = {
    "technical_skills",
    "programming_languages",
    "certificates",
    "natural_languages",
}

PROGRAMMING_LANGUAGES = {
    "python",
    "javascript",
    "typescript",
    "java",
    "c++",
    "c#",
    "go",
    "golang",
    "rust",
    "php",
    "ruby",
    "kotlin",
    "swift",
    "sql",
}

NATURAL_LANGUAGES = {
    "english",
    "vietnamese",
    "french",
    "german",
    "spanish",
    "japanese",
    "korean",
    "chinese",
}

SKILL_HINTS = {
    "fastapi",
    "django",
    "flask",
    "react",
    "next.js",
    "nextjs",
    "node.js",
    "nodejs",
    "express",
    "postgresql",
    "postgres",
    "mysql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "linux",
    "git",
    "rest api",
    "rest",
    "spring",
    "spring security",
    "jpa",
    "hibernate",
    "websquare",
    "rdbms",
    "devops",
    "github actions",
    "jenkins",
    "project management",
    "testing",
    "system design",
    "performance optimization",
    "graphql",
    "machine learning",
    "artificial intelligence",
}

CERTIFICATE_HINTS = {
    "aws certified",
    "azure certified",
    "google cloud certified",
    "ielts",
    "toeic",
    "pmp",
    "scrum",
    "certificate",
    "certification",
}

COMPATIBLE_SKILLS = {
    "javascript": {"typescript"},
    "rest": {"rest api"},
    "rest api": {"rest"},
}


def clean_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.replace("\r", "\n")).strip().lower()


def _normalize_token(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower()).strip(" .,:;()[]{}")


def _humanize_item(item: str) -> str:
    item = _normalize_token(item)
    known = {
        "sql": "SQL",
        "rest api": "REST API",
        "fastapi": "FastAPI",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "postgresql": "PostgreSQL",
        "mysql": "MySQL",
        "mongodb": "MongoDB",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "aws": "AWS",
        "gcp": "GCP",
        "jpa": "JPA",
        "rdbms": "RDBMS",
        "websquare": "WebSquare",
        "ci/cd": "CI/CD",
        "c++": "C++",
        "c#": "C#",
    }
    if item in known:
        return known[item]
    return item[:1].upper() + item[1:] if item else item


def _clamp_score(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, float(value)))


def _score100(value: float) -> float:
    return round(_clamp_score(value * 100.0), 3)


def _line_blocks(text: str) -> List[str]:
    lines = []
    for raw_line in (text or "").replace("\r", "\n").split("\n"):
        line = raw_line.strip(" \t-•*")
        if line:
            lines.append(line)
    return lines


def _list_blocks(text: str) -> List[str]:
    blocks = []
    for line in _line_blocks(text):
        blocks.extend(item.strip() for item in re.split(r"[;\n•|]", line) if item.strip())
    return blocks


def _section_for_heading(line: str) -> str | None:
    lowered = _normalize_token(re.sub(r"^\d+[\).\s-]+", "", line)).rstrip(":")
    word_count = len(lowered.split())
    is_heading_length = word_count <= 8

    if is_heading_length:
        mapped = HEADING_PHRASE_MAP.get(lowered)
        if mapped:
            return mapped

    if ":" in line:
        before_colon = _normalize_token(line.split(":", 1)[0]).rstrip(":")
        mapped = HEADING_PHRASE_MAP.get(before_colon)
        if mapped:
            return mapped

    for section, keywords in SECTION_SYNONYMS.items():
        for keyword in keywords:
            if lowered == keyword or lowered.startswith(f"{keyword}:"):
                return section
    return None


def _split_sections(text: str, default_section: str) -> Dict[str, str]:
    sections = {section: "" for section in SECTION_LABELS}
    sections["requirements"] = ""
    sections["preferred"] = ""
    sections["summary"] = ""
    sections["ignored"] = ""
    current = default_section

    for line in _line_blocks(text):
        heading = _section_for_heading(line)
        if heading:
            current = heading
            after_colon = line.split(":", 1)[1].strip() if ":" in line else ""
            if after_colon:
                if current in INTERNAL_SECTION_KEYS:
                    sections[current] = f"{sections.get(current, '')}\n{after_colon}".strip()
            continue
        if current in INTERNAL_SECTION_KEYS:
            sections[current] = f"{sections.get(current, '')}\n{line}".strip()

    return sections


def regex_extract(text: str) -> Dict[str, List[str]]:
    out = {"emails": [], "phones": [], "languages": [], "years": [], "months": []}
    if not text:
        return out
    out["emails"] = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    out["phones"] = re.findall(r"(?:\+\d{1,3}[\s-]?)?(?:\d[\d\s-]{6,}\d)", text)
    out["languages"] = [
        lang for lang in sorted(NATURAL_LANGUAGES) if re.search(rf"\b{re.escape(lang)}\b", text, flags=re.I)
    ]
    out["years"] = re.findall(r"(\d+(?:\.\d+)?)\s+years?", text, flags=re.I)
    out["months"] = re.findall(r"(\d+(?:\.\d+)?)\s+months?", text, flags=re.I)
    return out


def extract_experience_years(text: str) -> float:
    if not text:
        return 0.0
    years = [float(value) for value in re.findall(r"(\d+(?:\.\d+)?)\s*\+?\s+years?", text, flags=re.I)]
    months = [float(value) for value in re.findall(r"(\d+(?:\.\d+)?)\s+months?", text, flags=re.I)]
    total_years = max(years) if years else 0.0
    total_months = (max(months) / 12.0) if months else 0.0
    return total_years + total_months


def _required_experience_years(text: str) -> float:
    if not text:
        return 0.0
    explicit_years = re.search(r"\bexperience\s+years?\s*:\s*(\d+(?:\.\d+)?)\b", text, flags=re.I)
    if explicit_years:
        return float(explicit_years.group(1))
    years = re.findall(r"(\d+(?:\.\d+)?)\s*\+?\s+years?", text, flags=re.I)
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


def _load_alias_index(aliases: Dict[str, List[str]]) -> Dict[str, str]:
    index = {}
    for canonical, forms in aliases.items():
        canonical_norm = _normalize_token(canonical)
        index[canonical_norm] = canonical_norm
        for form in forms:
            index[_normalize_token(form)] = canonical_norm
    return index


def _canonicalize_item(item: str, alias_index: Dict[str, str]) -> str:
    normalized = _normalize_token(item)
    return alias_index.get(normalized, normalized)


def _dedupe(items: List[str]) -> List[str]:
    out = []
    seen = set()
    for item in items:
        normalized = _normalize_token(item)
        if not normalized or normalized in seen:
            continue
        out.append(normalized)
        seen.add(normalized)
    return out


def map_skills(raw_skills_text: str, aliases: Dict[str, List[str]]) -> List[str]:
    alias_index = _load_alias_index(aliases)
    return _extract_section_items("technical_skills", raw_skills_text, alias_index)


def _extract_known_terms(text: str, terms: set[str], alias_index: Dict[str, str]) -> List[str]:
    lowered = f" {_normalize_token(text)} "
    found = []
    search_terms = set(terms)
    search_terms.update(alias for alias, canonical in alias_index.items() if canonical in terms)

    for term in sorted(search_terms, key=len, reverse=True):
        if not term:
            continue
        pattern = r"(?<![a-z0-9+#.])" + re.escape(term) + r"(?![a-z0-9+#.])"
        if re.search(pattern, lowered):
            canonical = _canonicalize_item(term, alias_index)
            found.append(canonical)
    return _dedupe(found)


def _extract_list_items(text: str, alias_index: Dict[str, str]) -> List[str]:
    if not text:
        return []
    chunks = re.split(r"[,;\n•|/]| and | & ", text, flags=re.I)
    items = []
    for chunk in chunks:
        cleaned = re.sub(
            r"\b(required|requirements?|must have|preferred|nice to have|skills?|tools?|technologies?|languages?|certificates?)\b",
            "",
            chunk,
            flags=re.I,
        )
        cleaned = _normalize_token(cleaned)
        if not cleaned or len(cleaned.split()) > 5:
            continue
        items.append(_canonicalize_item(cleaned, alias_index))
    return _dedupe(items)


def _extract_section_items(section: str, text: str, alias_index: Dict[str, str]) -> List[str]:
    if section == "programming_languages":
        return _extract_known_terms(text, PROGRAMMING_LANGUAGES, alias_index)
    if section == "technical_skills":
        return _extract_known_terms(text, SKILL_HINTS | PROGRAMMING_LANGUAGES | set(alias_index.values()), alias_index)
    if section == "natural_languages":
        return _extract_known_terms(text, NATURAL_LANGUAGES, alias_index)
    if section == "certificates":
        return _extract_known_terms(text, CERTIFICATE_HINTS, alias_index)
    if section == "experience":
        items = []
        for line in _line_blocks(text):
            bare_years = re.fullmatch(r"\d+(?:\.\d+)?", line.strip())
            if bare_years:
                items.append(f"{bare_years.group(0)} years")
                continue
            if re.search(r"\b(years?|months?|experience|experienced)\b", line, flags=re.I):
                explicit_years = re.search(r"\bexperience\s+years?\s*:\s*(\d+(?:\.\d+)?)\b", line, flags=re.I)
                if explicit_years:
                    items.append(f"{explicit_years.group(1)} years")
                    continue
                year_match = re.search(
                    r"(\d+(?:\.\d+)?\s*\+?\s+years?)",
                    line,
                    flags=re.I,
                )
                if year_match:
                    items.append(year_match.group(1))
        return items
    if section in {"experience", "projects", "responsibilities", "education", "soft_skills"}:
        return [item for item in _list_blocks(text) if len(item.split()) >= 2]
    return _extract_list_items(text, alias_index)


def _tfidf_cosine(a: str, b: str) -> float:
    if not _HAVE_SKLEARN:
        sa = set((a or "").lower().split())
        sb = set((b or "").lower().split())
        if not sa or not sb:
            return 0.0
        return float(len(sa.intersection(sb)) / len(sa.union(sb)))
    try:
        vect = TfidfVectorizer().fit_transform([a or "", b or ""]).toarray()
        sim = cosine_similarity([vect[0]], [vect[1]])
        return float(sim[0][0])
    except ValueError:
        return 0.0


def _embed_cosine(a: str, b: str) -> float:
    if os.getenv("ENABLE_MATCHER_EMBEDDINGS") != "1":
        return _tfidf_cosine(a, b)
    try:
        model = get_model()
        vecs = model.encode([a or "", b or ""], convert_to_numpy=True)
        sim = cosine_similarity([vecs[0]], [vecs[1]])
        return float(sim[0][0])
    except Exception:
        return _tfidf_cosine(a, b)


def section_similarity(text_cv: str, text_jd: str, alpha: float = 0.75) -> float:
    if not text_cv or not text_jd:
        return 0.0
    tfidf_sim = _tfidf_cosine(text_cv, text_jd)
    if alpha <= 0:
        return tfidf_sim
    embed_sim = _embed_cosine(text_cv, text_jd)
    return float(alpha * embed_sim + (1 - alpha) * tfidf_sim)


def parse_sections_cv(text: str) -> Dict[str, str]:
    sections = _split_sections(text, "summary")
    return {
        "summary": sections.get("summary", ""),
        "skills": sections.get("technical_skills", ""),
        "technical_skills": sections.get("technical_skills", ""),
        "experience": sections.get("experience", ""),
        "projects": sections.get("projects", ""),
        "education": sections.get("education", ""),
        "certifications": sections.get("certificates", ""),
        "certificates": sections.get("certificates", ""),
        "coding_languages": sections.get("programming_languages", ""),
        "programming_languages": sections.get("programming_languages", ""),
        "languages": sections.get("natural_languages", ""),
        "natural_languages": sections.get("natural_languages", ""),
        "soft_skills": sections.get("soft_skills", ""),
        "responsibilities": sections.get("responsibilities", ""),
    }


def parse_sections_jd(text: str) -> Dict[str, str]:
    sections = _split_sections(text, "requirements")
    required_text = " ".join([sections.get("requirements", ""), sections.get("technical_skills", "")]).strip()
    return {
        "job_title": sections.get("summary", ""),
        "required_skills": required_text,
        "required_experience": sections.get("experience", "") or (required_text if re.search(r"\b(years?|months?|experience)\b", required_text, flags=re.I) else ""),
        "education_requirement": sections.get("education", ""),
        "language_requirement": sections.get("natural_languages", ""),
        "preferred_skills": sections.get("preferred", ""),
        "soft_skills": sections.get("soft_skills", ""),
        "responsibilities": sections.get("responsibilities", ""),
    }


def _extract_demands_from_jd(text: str, alias_index: Dict[str, str]) -> Dict[str, Dict[str, List[str]]]:
    sections = _split_sections(text, "requirements")
    demands = {"required": {}, "preferred": {}}
    required_lines = []
    preferred_lines = []

    for line in _line_blocks(text):
        if re.search(r"\b(preferred|nice to have|plus|bonus|desired)\b", line, flags=re.I):
            preferred_lines.append(line)
        elif re.search(r"\b(required|must have|requirements?|minimum|need|needs)\b", line, flags=re.I):
            required_lines.append(line)

    required_text = " ".join(
        required_lines
        + [
            sections.get("requirements", ""),
            sections.get("technical_skills", ""),
            sections.get("experience", ""),
            sections.get("natural_languages", ""),
            sections.get("education", ""),
            sections.get("certificates", ""),
        ]
    )
    preferred_text = " ".join([sections.get("preferred", ""), *preferred_lines])
    responsibility_text = " ".join([sections.get("responsibilities", ""), sections.get("projects", "")])

    for section in SECTION_LABELS:
        if section in {"technical_skills", "programming_languages", "experience", "natural_languages"}:
            source_text = f"{sections.get(section, '')} {required_text}"
        elif section in {"education", "certificates"}:
            source_text = sections.get(section, "")
        elif section == "responsibilities":
            source_text = sections.get("responsibilities", "")
        elif section == "projects":
            source_text = sections.get("projects", "")
        elif section == "soft_skills":
            source_text = sections.get("soft_skills", "")
        else:
            source_text = sections.get(section, "")
        demands["required"][section] = _extract_section_items(section, source_text, alias_index)
        preferred_source = preferred_text if section in {"technical_skills", "programming_languages", "experience", "natural_languages"} else ""
        demands["preferred"][section] = _extract_section_items(section, preferred_source, alias_index)

    return demands


def _extract_evidence_from_cv(text: str, alias_index: Dict[str, str]) -> Dict[str, List[str]]:
    sections = _split_sections(text, "summary")
    all_text = " ".join(sections.values())
    evidence = {}
    for section in SECTION_LABELS:
        section_text = sections.get(section, "")
        if section in STRICT_SECTIONS:
            section_text = f"{section_text} {all_text}"
        elif section == "experience":
            section_text = f"{section_text}\n{sections.get('summary', '')}"
        elif section == "responsibilities":
            section_text = "\n".join(
                [
                    sections.get("responsibilities", ""),
                    sections.get("projects", ""),
                    sections.get("experience", ""),
                    sections.get("summary", ""),
                ]
            )
        evidence[section] = _extract_section_items(section, section_text, alias_index)
    return evidence


def _strict_item_match(required_item: str, evidence_items: List[str], alias_index: Dict[str, str]) -> bool:
    required = _canonicalize_item(required_item, alias_index)
    evidence_set = {_canonicalize_item(item, alias_index) for item in evidence_items}
    if required in evidence_set:
        return True
    if COMPATIBLE_SKILLS.get(required, set()).intersection(evidence_set):
        return True
    pattern = r"(?<![a-z0-9+#.])" + re.escape(required) + r"(?![a-z0-9+#.])"
    return any(re.search(pattern, item) for item in evidence_set)


def _known_terms_in_item(text: str, alias_index: Dict[str, str]) -> List[str]:
    terms = SKILL_HINTS | PROGRAMMING_LANGUAGES | NATURAL_LANGUAGES | set(alias_index.values())
    return _extract_known_terms(text, terms, alias_index)


def _keyword_item_match(required_item: str, evidence_items: List[str], alias_index: Dict[str, str]) -> bool:
    required_terms = set(_known_terms_in_item(required_item, alias_index))
    if not required_terms:
        return False

    evidence_terms = set()
    for item in evidence_items:
        evidence_terms.update(_known_terms_in_item(item, alias_index))

    if not evidence_terms:
        return False

    overlap = required_terms.intersection(evidence_terms)
    coverage = len(overlap) / len(required_terms)
    if len(required_terms) <= 2:
        return coverage >= 1.0
    return coverage >= 0.6


def _semantic_item_match(required_item: str, evidence_items: List[str], alpha: float) -> bool:
    if not required_item or not evidence_items:
        return False
    return max((section_similarity(item, required_item, alpha=alpha) for item in evidence_items), default=0.0) >= 0.35


def _stem_for_overlap(token: str) -> str:
    token = re.sub(r"[^a-z0-9+#.]", "", token.lower())
    for suffix in ("ing", "ed", "s"):
        if len(token) > len(suffix) + 3 and token.endswith(suffix):
            return token[: -len(suffix)]
    return token


def _token_overlap_item_match(required_item: str, evidence_items: List[str]) -> bool:
    stopwords = {
        "and",
        "or",
        "the",
        "a",
        "an",
        "with",
        "for",
        "to",
        "of",
        "in",
        "on",
        "as",
        "role",
        "experience",
        "required",
        "requirement",
    }
    required_tokens = {
        _stem_for_overlap(token)
        for token in re.findall(r"[a-z0-9+#.]+", required_item.lower())
        if token.lower() not in stopwords and len(token) > 2
    }
    if not required_tokens:
        return False

    for item in evidence_items:
        evidence_tokens = {
            _stem_for_overlap(token)
            for token in re.findall(r"[a-z0-9+#.]+", item.lower())
            if token.lower() not in stopwords and len(token) > 2
        }
        if not evidence_tokens:
            continue
        coverage = len(required_tokens.intersection(evidence_tokens)) / len(required_tokens)
        if coverage >= (0.5 if len(required_tokens) <= 3 else 0.4):
            return True
    return False


def _section_explanation(label: str, good: List[str], missing: List[str]) -> str:
    if good and missing:
        return f"Candidate has relevant {label.lower()} evidence but still misses some JD demands."
    if good:
        return f"Candidate satisfies the detected {label.lower()} demands."
    if missing:
        return f"Candidate is missing detected {label.lower()} demands from the JD."
    return ""


def _section_result(
    section: str,
    required_items: List[str],
    preferred_items: List[str],
    evidence_items: List[str],
    weight: float,
    alpha: float,
    alias_index: Dict[str, str],
) -> Dict:
    good = []
    missing = []
    matched_required = 0.0
    matched_preferred = 0.0

    semantic_required_items = required_items
    experience_year_required = section == "experience" and _required_experience_years(" ".join(required_items)) > 0
    if section == "experience":
        semantic_required_items = [item for item in required_items if _required_experience_years(item) == 0]

    required_total = len(semantic_required_items)
    preferred_total = len(preferred_items)
    if experience_year_required:
        required_total += 1
    preferred_weight = 0.25
    denominator = (required_total * 1.0) + (preferred_total * preferred_weight)
    if denominator == 0:
        return {
            "key": section,
            "label": SECTION_LABELS[section],
            "score": None,
            "weight": weight,
            "applicable": False,
            "good": [],
            "missing": [],
            "explanation": "",
        }

    for item in semantic_required_items:
        matched = (
            _strict_item_match(item, evidence_items, alias_index)
            if section in STRICT_SECTIONS
            else (
                _keyword_item_match(item, evidence_items, alias_index)
                or _token_overlap_item_match(item, evidence_items)
                or _semantic_item_match(item, evidence_items, alpha)
            )
        )
        if matched:
            matched_required += 1
            good.append(f"{_humanize_item(item)} matched")
        else:
            missing.append(f"{_humanize_item(item)} missing")

    for item in preferred_items:
        matched = (
            _strict_item_match(item, evidence_items, alias_index)
            if section in STRICT_SECTIONS
            else (
                _keyword_item_match(item, evidence_items, alias_index)
                or _token_overlap_item_match(item, evidence_items)
                or _semantic_item_match(item, evidence_items, alpha)
            )
        )
        if matched:
            matched_preferred += 1
            good.append(f"Preferred {_humanize_item(item)} matched")
        else:
            missing.append(f"Preferred {_humanize_item(item)} missing")

    if section == "experience":
        required_years = _required_experience_years(" ".join(required_items))
        candidate_years = extract_experience_years(" ".join(evidence_items))
        if required_years > 0:
            if candidate_years >= required_years:
                matched_required += 1
                good.append(f"{candidate_years:g} years experience found")
            elif candidate_years > 0:
                partial_credit = min(0.85, candidate_years / required_years)
                matched_required += partial_credit
                good.append(f"{candidate_years:g} years partial experience found")
                missing.append(f"{required_years:g}+ years experience required")
            else:
                missing.append(f"{required_years:g}+ years experience required")

    score = ((matched_required * 1.0) + (matched_preferred * preferred_weight)) / denominator

    score100 = _score100(score)
    good = _dedupe(good)
    missing = _dedupe(missing)
    return {
        "key": section,
        "label": SECTION_LABELS[section],
        "score": score100,
        "weight": weight,
        "applicable": True,
        "good": good,
        "missing": missing,
        "explanation": _section_explanation(SECTION_LABELS[section], good, missing),
    }


def rule_based_checks(parsed_cv: Dict[str, str], parsed_jd: Dict[str, str], extra: Dict) -> Tuple[List[str], List[str]]:
    passes = []
    fails = []
    jd_langs = parsed_jd.get("language_requirement", "")
    if jd_langs:
        cv_langs = parsed_cv.get("languages", "")
        matched = False
        for lang in sorted(NATURAL_LANGUAGES):
            if lang in jd_langs.lower() and lang in cv_langs.lower():
                matched = True
                passes.append(f"language:{lang}")
        if not matched:
            fails.append("missing_required_language")

    required_years = _required_experience_years(parsed_jd.get("required_experience", ""))
    candidate_years = extract_experience_years(parsed_cv.get("experience", "") or parsed_cv.get("skills", ""))
    if required_years > 0:
        if candidate_years >= required_years:
            passes.append(f"experience_years:{candidate_years:.2f}")
        else:
            fails.append(f"insufficient_experience:{candidate_years:.2f}<{required_years:.2f}")
    return passes, fails


def _normalize_weights(weights: Dict[str, float] | None) -> Dict[str, float]:
    source = weights or DEFAULT_WEIGHTS
    usable = {section: max(0.0, float(source.get(section, 0.0))) for section in DEFAULT_WEIGHTS}
    total = sum(usable.values())
    if total <= 0:
        return DEFAULT_WEIGHTS.copy()
    return {section: value / total for section, value in usable.items()}


def _infer_must_have(demands: Dict[str, Dict[str, List[str]]]) -> List[str]:
    must_have = []
    for section in ("technical_skills", "programming_languages", "experience", "natural_languages"):
        must_have.extend(demands["required"].get(section, [])[:3])
    return _dedupe(must_have)


def _core_fit_score(section_scores: Dict[str, float | None]) -> float | None:
    core_weights = {
        "technical_skills": 0.45,
        "programming_languages": 0.20,
        "experience": 0.25,
        "natural_languages": 0.10,
    }
    applicable = {
        section: weight
        for section, weight in core_weights.items()
        if isinstance(section_scores.get(section), (int, float))
    }
    total = sum(applicable.values())
    if total <= 0:
        return None
    return sum(float(section_scores[section]) * weight for section, weight in applicable.items()) / total


def score_cv_vs_jd(
    cv_text: str,
    jd_text: str,
    weights: Dict[str, float] = None,
    alpha: float = 0.7,
    alpha_map: Dict[str, float] = None,
    must_have: List[str] | None = None,
) -> Dict:
    aliases = load_aliases()
    alias_index = _load_alias_index(aliases)
    normalized_weights = _normalize_weights(weights)
    effective_alpha_map = {**DEFAULT_ALPHA_MAP, **(alpha_map or {})}

    parsed_cv = parse_sections_cv(cv_text)
    parsed_jd = parse_sections_jd(jd_text)
    regex_cv = regex_extract(cv_text)
    regex_jd = regex_extract(jd_text)
    demands = _extract_demands_from_jd(jd_text, alias_index)
    evidence = _extract_evidence_from_cv(cv_text, alias_index)

    sections = []
    section_scores = {}
    good_points = []
    missing_points = []

    for section in DEFAULT_WEIGHTS:
        result = _section_result(
            section=section,
            required_items=demands["required"].get(section, []),
            preferred_items=demands["preferred"].get(section, []),
            evidence_items=evidence.get(section, []),
            weight=round(normalized_weights[section], 4),
            alpha=effective_alpha_map.get(section, alpha),
            alias_index=alias_index,
        )
        section_scores[section] = result["score"]
        if result["score"] or result["good"] or result["missing"] or result["explanation"]:
            sections.append(result)
            good_points.extend(result["good"])
            missing_points.extend(result["missing"])

    applicable_sections = [
        section
        for section in DEFAULT_WEIGHTS
        if isinstance(section_scores.get(section), (int, float))
    ]
    applicable_weight = sum(normalized_weights[section] for section in applicable_sections)
    if applicable_weight > 0:
        raw_score = sum(
            section_scores[section] * normalized_weights[section]
            for section in applicable_sections
        ) / applicable_weight
    else:
        raw_score = 0.0
    core_score = _core_fit_score(section_scores)
    calibrated_score = raw_score
    if core_score is not None:
        calibrated_score = max(raw_score, (raw_score * 0.35) + (core_score * 0.65))

    must_have_items = must_have if must_have is not None else _infer_must_have(demands)
    must_have_matched = []
    must_have_missing = []
    all_evidence_items = [item for items in evidence.values() for item in items]
    for item in must_have_items:
        canonical = _canonicalize_item(item, alias_index)
        required_years = _required_experience_years(canonical)
        candidate_years = extract_experience_years(" ".join(evidence.get("experience", [])))
        if required_years > 0 and candidate_years >= required_years:
            must_have_matched.append(_humanize_item(canonical))
        elif (
            _strict_item_match(canonical, all_evidence_items, alias_index)
            or _keyword_item_match(canonical, all_evidence_items, alias_index)
            or _semantic_item_match(canonical, all_evidence_items, 0.25)
        ):
            must_have_matched.append(_humanize_item(canonical))
        else:
            must_have_missing.append(_humanize_item(canonical))

    must_have_total = len(must_have_matched) + len(must_have_missing)
    if must_have_total == 0:
        penalty = 0.0
    else:
        missing_rate = len(must_have_missing) / must_have_total
        penalty = min(15.0, missing_rate * 15.0)
        if len(must_have_matched) >= len(must_have_missing):
            penalty *= 0.5
    penalty = round(penalty, 3)
    orig_final_score = round(_clamp_score(calibrated_score - penalty), 3)

    passes, fails = rule_based_checks(parsed_cv, parsed_jd, {})
    for missing in must_have_missing:
        fails.append(f"missing_must_have:{missing}")

    good_points = _dedupe(good_points)
    missing_points = _dedupe(missing_points)
    summary = {
        "good_count": len(good_points),
        "missing_count": len(missing_points),
        "must_have_matched_count": len(must_have_matched),
        "must_have_missing_count": len(must_have_missing),
    }

    # Now call our new hybrid scoring system
    from app.services.cv_scoring import CvScoringService
    scoring_service = CvScoringService()
    scoring_result = scoring_service.score_cv_vs_jd(cv_text, jd_text, custom_weights=weights)

    final_score = scoring_result["finalScore"]
    sub_scores = scoring_result["subScores"]
    matched = scoring_result["matched"]
    missing_or_weak = scoring_result["missingOrWeak"]
    reasoning_summary = scoring_result["reasoningSummary"]

    new_sections = [
        {
            "key": "required_skills",
            "label": "Required Skills Match",
            "score": sub_scores["required_skills"],
            "good": matched["required_skills"],
            "missing": missing_or_weak["required_skills"],
            "explanation": reasoning_summary
        },
        {
            "key": "project_domain",
            "label": "Project / Domain Relevance",
            "score": sub_scores["project_domain"],
            "good": matched["project_domain"],
            "missing": missing_or_weak["project_domain"],
            "explanation": reasoning_summary
        },
        {
            "key": "seniority",
            "label": "Years of Experience / Seniority",
            "score": sub_scores["seniority"],
            "good": matched["seniority"],
            "missing": missing_or_weak["seniority"],
            "explanation": reasoning_summary
        },
        {
            "key": "responsibility",
            "label": "Responsibility Match",
            "score": sub_scores["responsibility"],
            "good": matched["responsibility"],
            "missing": missing_or_weak["responsibility"],
            "explanation": reasoning_summary
        },
        {
            "key": "testing_documentation",
            "label": "Testing / Documentation / Quality Evidence",
            "score": sub_scores["testing_documentation"],
            "good": matched["testing_documentation"],
            "missing": missing_or_weak["testing_documentation"],
            "explanation": reasoning_summary
        },
        {
            "key": "language_collaboration",
            "label": "Language / Collaboration",
            "score": sub_scores["language_collaboration"],
            "good": matched["language_collaboration"],
            "missing": missing_or_weak["language_collaboration"],
            "explanation": reasoning_summary
        },
        {
            "key": "bonus_skills",
            "label": "Bonus Skills",
            "score": sub_scores["bonus_skills"],
            "good": matched["bonus_skills"],
            "missing": missing_or_weak["bonus_skills"],
            "explanation": reasoning_summary
        }
    ]

    return {
        "overall_score": orig_final_score,
        "final_score": orig_final_score,
        "finalScore": final_score,
        "subScores": sub_scores,
        "matched": matched,
        "missingOrWeak": missing_or_weak,
        "reasoningSummary": reasoning_summary,
        "summary": summary,
        "raw_score": raw_score,
        "core_fit_score": core_score,
        "calibrated_score": calibrated_score,
        "sections": new_sections + sections,
        "good_points": good_points,
        "missing_points": missing_points,
        "must_have": {
            "matched": must_have_matched,
            "missing": must_have_missing,
            "penalty_applied": penalty,
        },
        "parsed_cv": parsed_cv,
        "parsed_jd": parsed_jd,
        "regex_cv": regex_cv,
        "regex_jd": regex_jd,
        "mapped_skills": map_skills(parsed_cv.get("skills", ""), aliases),
        "section_scores": {**section_scores, **sub_scores},
        "passes": passes,
        "fails": fails,
        "alpha_map": effective_alpha_map,
        "score_scale": "0-100",
    }


if __name__ == "__main__":
    sample_cv = """
    John Doe
    Skills: Python, Django, PostgreSQL
    Experience: 5 years building backend APIs
    Projects: e-commerce REST API
    Languages: English
    """
    sample_jd = """
    Backend Engineer
    Requirements: Python, Django, Docker, 3+ years experience
    Language: English
    Preferred: Kubernetes
    Responsibilities: Build REST APIs
    """
    out = score_cv_vs_jd(sample_cv, sample_jd)
    print(json.dumps(out, indent=2, ensure_ascii=False))
