import re
import os
from typing import Dict, List, Tuple, Set, Any
from app.services.matcher import (
    section_similarity,
    _tfidf_cosine,
    _normalize_token,
    extract_experience_years,
    _required_experience_years,
    _dedupe,
    SKILL_HINTS,
    PROGRAMMING_LANGUAGES,
    NATURAL_LANGUAGES,
    load_aliases,
    _load_alias_index,
    _extract_known_terms,
)

class ScoringWeightsConfig:
    # 7 core criteria weights
    DEFAULT_WEIGHTS = {
        "required_skills": 0.30,
        "project_domain": 0.25,
        "seniority": 0.15,
        "responsibility": 0.10,
        "testing_documentation": 0.10,
        "language_collaboration": 0.05,
        "bonus_skills": 0.05
    }

    # Keyword lists for default matching if JD doesn't list specific items
    REQUIRED_SKILLS_KEYWORDS = ["java", "spring framework", "spring boot", "html", "css", "javascript", "rest api", "sql"]
    PROJECT_DOMAIN_KEYWORDS = ["retail", "pos", "reuse", "second-hand business", "inventory", "store operation", "core system", "system replacement", "enterprise system", "multi-country business system", "large-scale system"]
    RESPONSIBILITY_KEYWORDS = ["system design", "function design", "ui design", "implementation", "backend development", "frontend development", "test case design", "system testing", "collaboration with japanese team", "requirement analysis", "technical specification"]
    SENIORITY_KEYWORDS = ["5+ years of experience", "senior developer", "module lead", "technical lead", "mentoring", "code review", "architecture design"]
    TESTING_DOCUMENTATION_KEYWORDS = ["test case", "system test", "unit test", "integration test", "regression test", "code quality", "code review", "technical document", "english design document", "specification document"]
    LANGUAGE_COLLABORATION_KEYWORDS = ["english documentation", "japanese communication", "japanese team collaboration", "offshore development", "cross-cultural team"]
    BONUS_SKILLS_KEYWORDS = ["aws", "docker", "kubernetes", "ci/cd", "redis", "kafka", "performance tuning", "security", "oauth2", "jwt", "playwright"]

    # Synonym dictionary
    SYNONYM_DICT = {
        "system replacement": ["system replacement", "system replace", "modernization", "migration", "nâng cấp hệ thống", "chuyển đổi hệ thống"],
        "retail": ["retail", "store operation", "shop management", "bán lẻ", "vận hành cửa hàng", "quản lý cửa hàng"],
        "pos": ["pos", "point of sale", "cashier system", "hệ thống tính tiền", "hệ thống pos"],
        "inventory": ["inventory", "stock management", "quản lý kho", "tồn kho"],
        "technical specification": ["technical specification", "design specification", "specifications", "spec", "design doc", "design document", "tài liệu thiết kế", "thiết kế kỹ thuật"],
        "test case design": ["test case design", "designed test case", "design test case", "write test case", "testing scenario", "kịch bản kiểm thử", "thiết kế test case"],
        "reuse": ["reuse", "second-hand", "pre-owned", "tái sử dụng", "đồ cũ"],
        "system design": ["system design", "architecture design", "designing systems", "designed system", "thiết kế hệ thống"],
        "senior developer": ["senior developer", "senior engineer", "senior full stack", "sr. developer", "sr. engineer"],
        "technical lead": ["technical lead", "tech lead", "lead engineer", "module lead"],
        "architecture design": ["architecture design", "system design", "system replacement", "architecture"],
        "collaboration with japanese team": ["japanese team", "japanese client", "japanese offshore", "offshore development", "japanese communication"]
    }

    # Action verbs and business contexts for project evidence scoring
    ACTION_VERBS = [
        "design", "develop", "implement", "build", "lead", "optimize", "manage", "deploy", "refactor", "architect",
        "thiết kế", "phát triển", "xây dựng", "triển khai", "tối ưu", "quản lý", "vận hành",
        "開発", "設計", "実装", "構築", "導入", "運用"
    ]
    BUSINESS_CONTEXTS = [
        "inventory", "pos", "system", "retail", "business", "application", "database", "module", "transaction", "platform",
        "hệ thống", "dự án", "nghiệp vụ", "bán lẻ", "bán hàng", "kho", "giao dịch",
        "システム", "業務", "小売", "店舗", "在庫", "プロジェクト"
    ]


class KeywordMatcher:
    def __init__(self, synonym_dict: Dict[str, List[str]]):
        self.synonym_dict = synonym_dict

    def _normalize(self, text: str) -> str:
        text = (text or "").lower()
        # Replace slash and backslash with spaces to handle unit/integration
        text = text.replace("/", " ").replace("\\", " ")
        return re.sub(r"\s+", " ", text).strip(" .,:;()[]{}")

    def _match_term(self, term: str, text: str) -> bool:
        normalized_term = self._normalize(term)
        normalized_text = f" {self._normalize(text)} "
        
        # Check synonyms if any
        syns = [normalized_term]
        for canonical, forms in self.synonym_dict.items():
            if normalized_term == self._normalize(canonical):
                syns.extend(self._normalize(f) for f in forms)
            elif normalized_term in [self._normalize(f) for f in forms]:
                syns.append(self._normalize(canonical))
                syns.extend(self._normalize(f) for f in forms)
        
        syns = list(set(syns))
        for syn in syns:
            if not syn:
                continue
            # Regex match with word boundaries or special characters support (like C++, C#)
            pattern = r"(?<![a-z0-9+#.])" + re.escape(syn) + r"(?![a-z0-9+#.])"
            if re.search(pattern, normalized_text):
                return True
            # Also support singular/plural mismatch (e.g. if syn is "test case" and CV has "test cases")
            if syn.endswith("s"):
                singular = syn[:-1]
                pattern_sing = r"(?<![a-z0-9+#.])" + re.escape(singular) + r"(?![a-z0-9+#.])"
                if re.search(pattern_sing, normalized_text):
                    return True
            else:
                plural = syn + "s"
                pattern_plur = r"(?<![a-z0-9+#.])" + re.escape(plural) + r"(?![a-z0-9+#.])"
                if re.search(pattern_plur, normalized_text):
                    return True
        return False

    def match_unique_keywords(self, target_keywords: List[str], text: str) -> Tuple[List[str], List[str]]:
        """
        Count unique matched terms, preventing keyword stuffing.
        Returns (matched, missing) lists.
        """
        matched = []
        missing = []
        for kw in target_keywords:
            if self._match_term(kw, text):
                matched.append(kw)
            else:
                missing.append(kw)
        return matched, missing


class SemanticMatcher:
    def __init__(self, alpha: float = 0.7):
        self.alpha = alpha

    def score_similarity(self, a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        sim = section_similarity(a, b, alpha=self.alpha)
        # If SBERT embeddings are disabled or fail, we scale the TF-IDF similarity to be more representative
        if os.getenv("ENABLE_MATCHER_EMBEDDINGS") != "1":
            if sim > 0:
                sim = min(1.0, 0.4 + (sim / 0.3) * 0.6)
        else:
            sim = min(1.0, max(0.0, sim))
        return sim


class EvidenceExtractor:
    def __init__(self, action_verbs: List[str], business_contexts: List[str]):
        self.action_verbs = [v.lower() for v in action_verbs]
        self.business_contexts = [c.lower() for c in business_contexts]

    def extract_evidence_confidence(self, skill: str, cv_text: str) -> float:
        """
        Detects whether a skill is inside meaningful project/experience descriptions.
        Returns confidence score between 0.5 (just listed) and 1.0 (strong project context).
        """
        skill_norm = _normalize_token(skill)
        if not skill_norm:
            return 0.5

        # Split cv_text into lines/sentences
        lines = [line.strip().lower() for line in re.split(r'[.\n•\-*;]', cv_text) if line.strip()]
        
        for line in lines:
            if skill_norm in line:
                # Check if it has action verbs or business context in the same line
                has_verb = any(verb in line for verb in self.action_verbs)
                has_context = any(context in line for context in self.business_contexts)
                if has_verb and has_context:
                    return 1.0
                elif has_verb or has_context:
                    return 0.8
        return 0.5


class ScoringExplanationBuilder:
    @staticmethod
    def build_reasoning_summary(sub_scores: Dict[str, float], matched: Dict[str, List[str]], missing: Dict[str, List[str]], years_experience: float) -> str:
        strengths = []
        weaknesses = []

        # Analyze required skills
        req_score = sub_scores.get("required_skills", 0)
        if req_score >= 80:
            strengths.append(f"ứng viên có kỹ năng chuyên môn rất tốt ({', '.join(matched.get('required_skills', [])[:4])})")
        elif req_score < 50:
            weaknesses.append("thiếu nhiều kỹ năng chuyên môn bắt buộc")

        # Analyze project domain
        proj_score = sub_scores.get("project_domain", 0)
        if proj_score >= 75:
            strengths.append("kinh nghiệm làm việc trong lĩnh vực liên quan (như retail, inventory) rõ ràng")
        elif proj_score < 40:
            weaknesses.append("kinh nghiệm dự án trong lĩnh vực tương tự còn hạn chế")

        # Analyze seniority/experience
        if years_experience >= 5:
            strengths.append(f"kinh nghiệm làm việc dày dặn ({years_experience:g} năm)")
        elif years_experience > 0 and years_experience < 3:
            weaknesses.append(f"số năm kinh nghiệm thực tế còn ít ({years_experience:g} năm)")

        # Analyze testing / documentation
        test_score = sub_scores.get("testing_documentation", 0)
        if test_score >= 70:
            strengths.append("có bằng chứng tốt về kỹ năng kiểm thử và viết tài liệu kỹ thuật")
        elif test_score < 40:
            weaknesses.append("thiếu kinh nghiệm kiểm thử hoặc viết tài liệu")

        # Combine reasoning summary
        strength_str = ", ".join(strengths)
        weakness_str = ", ".join(weaknesses)
        
        summary = "Ứng viên có độ phù hợp khá cao."
        if strength_str:
            summary = f"Ứng viên có ưu điểm nổi bật: {strength_str}."
        if weakness_str:
            summary += f" Tuy nhiên, điểm cần cải thiện là: {weakness_str}."
        
        return summary


class CriteriaScoringService:
    def __init__(self, config: ScoringWeightsConfig, alpha: float = 0.7):
        self.config = config
        self.keyword_matcher = KeywordMatcher(config.SYNONYM_DICT)
        self.semantic_matcher = SemanticMatcher(alpha=alpha)
        self.evidence_extractor = EvidenceExtractor(config.ACTION_VERBS, config.BUSINESS_CONTEXTS)

    def score_required_skills(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 60% keyword match + 40% semantic match
        keywords = jd_keywords if jd_keywords else self.config.REQUIRED_SKILLS_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0
        
        # Apply project evidence confidence modifier
        evidence_scores = []
        for kw in matched_kws:
            confidence = self.evidence_extractor.extract_evidence_confidence(kw, cv_text)
            evidence_scores.append(confidence)
        
        evidence_mult = (sum(0.8 + 0.2 * c for c in evidence_scores) / len(matched_kws)) if matched_kws else 1.0
        kw_score = kw_score * evidence_mult
        
        # Semantic score
        cv_skills_section = cv_text # Full text fallback
        jd_skills_section = jd_text
        sem_sim = self.semantic_matcher.score_similarity(cv_skills_section, jd_skills_section)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))
        
        final_sub_score = 0.6 * kw_score + 0.4 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_project_domain(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 30% keyword match + 70% semantic match
        keywords = jd_keywords if jd_keywords else self.config.PROJECT_DOMAIN_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.3 * kw_score + 0.7 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_responsibility(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 50% keyword match + 50% semantic match
        keywords = jd_keywords if jd_keywords else self.config.RESPONSIBILITY_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.5 * kw_score + 0.5 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_testing_documentation(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 60% keyword match + 40% semantic match
        keywords = jd_keywords if jd_keywords else self.config.TESTING_DOCUMENTATION_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.6 * kw_score + 0.4 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_seniority(self, cv_text: str, jd_text: str) -> Tuple[float, List[str], List[str]]:
        # Seniority relies on experience years + keywords
        req_years = _required_experience_years(jd_text)
        cand_years = extract_experience_years(cv_text)
        
        matched = []
        missing = []
        
        # Base score from years matching
        if req_years <= 0:
            years_score = 70.0  # default baseline if no years specified
        else:
            if cand_years >= req_years:
                years_score = 100.0
                matched.append(f"{cand_years:g} years of experience (required: {req_years:g})")
            elif cand_years > 0:
                years_score = (cand_years / req_years) * 100.0
                matched.append(f"{cand_years:g} years of experience")
                missing.append(f"required: {req_years:g} years of experience")
            else:
                years_score = 0.0
                missing.append(f"required: {req_years:g} years of experience")

        # Keywords checking for seniority context (e.g. mentor, architecture)
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(self.config.SENIORITY_KEYWORDS, cv_text)
        kw_score = (len(matched_kws) / len(self.config.SENIORITY_KEYWORDS) * 100.0) if self.config.SENIORITY_KEYWORDS else 0.0
        
        matched.extend(matched_kws)
        missing.extend(missing_kws)
        
        # Combine
        final_sub_score = 0.7 * years_score + 0.3 * kw_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched, missing

    def score_language_collaboration(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 50% keyword match + 50% semantic match
        keywords = jd_keywords if jd_keywords else self.config.LANGUAGE_COLLABORATION_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.5 * kw_score + 0.5 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_bonus_skills(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 50% keyword match + 50% semantic match
        keywords = jd_keywords if jd_keywords else self.config.BONUS_SKILLS_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.5 * kw_score + 0.5 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws


class CvScoringService:
    def __init__(self, config: ScoringWeightsConfig = None, alpha: float = 0.7):
        self.config = config or ScoringWeightsConfig()
        self.criteria_service = CriteriaScoringService(self.config, alpha=alpha)

    def parse_demands_from_text(self, text: str) -> Dict[str, List[str]]:
        """
        Parses requirements and preferred lists directly from JD text for keyword matching.
        """
        aliases = load_aliases()
        alias_index = _load_alias_index(aliases)
        
        # 1. Required skills (Technical skills + programming languages)
        all_skills = SKILL_HINTS | PROGRAMMING_LANGUAGES | set(alias_index.values())
        extracted_skills = _extract_known_terms(text, all_skills, alias_index)
        
        # 2. Bonus skills
        # Look for typical devops / advanced keywords in text
        bonus_terms = {"aws", "docker", "kubernetes", "ci/cd", "redis", "kafka", "playwright"}
        extracted_bonus = [t for t in bonus_terms if re.search(r"\b" + re.escape(t) + r"\b", text.lower())]
        
        # 3. Languages
        extracted_languages = _extract_known_terms(text, NATURAL_LANGUAGES, alias_index)
        
        # 4. Project/Domain
        # Look for domain words
        extracted_domain = [t for t in self.config.PROJECT_DOMAIN_KEYWORDS if re.search(r"\b" + re.escape(t) + r"\b", text.lower())]
        
        # 5. Responsibility
        extracted_resp = [t for t in self.config.RESPONSIBILITY_KEYWORDS if re.search(r"\b" + re.escape(t) + r"\b", text.lower())]
        
        # 6. Testing / Documentation
        extracted_testing = [t for t in self.config.TESTING_DOCUMENTATION_KEYWORDS if re.search(r"\b" + re.escape(t) + r"\b", text.lower())]

        return {
            "required_skills": extracted_skills if extracted_skills else self.config.REQUIRED_SKILLS_KEYWORDS,
            "project_domain": extracted_domain if extracted_domain else self.config.PROJECT_DOMAIN_KEYWORDS,
            "responsibility": extracted_resp if extracted_resp else self.config.RESPONSIBILITY_KEYWORDS,
            "testing_documentation": extracted_testing if extracted_testing else self.config.TESTING_DOCUMENTATION_KEYWORDS,
            "language_collaboration": extracted_languages if extracted_languages else self.config.LANGUAGE_COLLABORATION_KEYWORDS,
            "bonus_skills": extracted_bonus if extracted_bonus else self.config.BONUS_SKILLS_KEYWORDS,
        }

    def score_cv_vs_jd(self, cv_text: str, jd_text: str, custom_weights: Dict[str, float] = None) -> Dict[str, Any]:
        weights = self.config.DEFAULT_WEIGHTS
        if custom_weights:
            # Normalize custom weights
            total = sum(custom_weights.values())
            if total > 0:
                weights = {k: custom_weights.get(k, 0.0) / total for k in self.config.DEFAULT_WEIGHTS}

        demands = self.parse_demands_from_text(jd_text)

        # Calculate criteria scores
        req_score, req_matched, req_missing = self.criteria_service.score_required_skills(cv_text, jd_text, demands["required_skills"])
        proj_score, proj_matched, proj_missing = self.criteria_service.score_project_domain(cv_text, jd_text, demands["project_domain"])
        resp_score, resp_matched, resp_missing = self.criteria_service.score_responsibility(cv_text, jd_text, demands["responsibility"])
        test_score, test_matched, test_missing = self.criteria_service.score_testing_documentation(cv_text, jd_text, demands["testing_documentation"])
        lang_score, lang_matched, lang_missing = self.criteria_service.score_language_collaboration(cv_text, jd_text, demands["language_collaboration"])
        bonus_score, bonus_matched, bonus_missing = self.criteria_service.score_bonus_skills(cv_text, jd_text, demands["bonus_skills"])
        senior_score, senior_matched, senior_missing = self.criteria_service.score_seniority(cv_text, jd_text)

        sub_scores = {
            "required_skills": req_score,
            "project_domain": proj_score,
            "seniority": senior_score,
            "responsibility": resp_score,
            "testing_documentation": test_score,
            "language_collaboration": lang_score,
            "bonus_skills": bonus_score
        }

        # Final Score calculation
        final_score = sum(sub_scores[k] * weights[k] for k in weights)
        final_score = round(max(0.0, min(100.0, final_score)), 1)

        matched = {
            "required_skills": req_matched,
            "project_domain": proj_matched,
            "seniority": senior_matched,
            "responsibility": resp_matched,
            "testing_documentation": test_matched,
            "language_collaboration": lang_matched,
            "bonus_skills": bonus_matched
        }

        missing_or_weak = {
            "required_skills": req_missing,
            "project_domain": proj_missing,
            "seniority": senior_missing,
            "responsibility": resp_missing,
            "testing_documentation": test_missing,
            "language_collaboration": lang_missing,
            "bonus_skills": bonus_missing
        }

        cand_years = extract_experience_years(cv_text)
        reasoning_summary = ScoringExplanationBuilder.build_reasoning_summary(
            sub_scores, matched, missing_or_weak, cand_years
        )

        return {
            "finalScore": final_score,
            "subScores": sub_scores,
            "matched": matched,
            "missingOrWeak": missing_or_weak,
            "reasoningSummary": reasoning_summary
        }
