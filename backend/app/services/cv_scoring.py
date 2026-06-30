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
    REQUIRED_SKILLS_KEYWORDS = ["java", "spring framework", "spring boot", "html", "css", "javascript", "typescript", "rest api", "sql"]
    PROJECT_DOMAIN_KEYWORDS = ["retail", "pos", "pos integration", "reuse", "second-hand business", "inventory", "store operation", "core system", "system replacement", "enterprise system", "multi-country business system", "large-scale system", "large data processing"]
    RESPONSIBILITY_KEYWORDS = ["system design", "function design", "ui design", "implementation", "backend development", "frontend development", "test case design", "system testing", "collaboration with japanese team", "requirement analysis", "technical specification", "api specification", "mentoring"]
    SENIORITY_KEYWORDS = ["5+ years of experience", "senior developer", "module lead", "technical lead", "mentoring", "code review", "architecture design"]
    TESTING_DOCUMENTATION_KEYWORDS = ["test case", "system test", "system test scenario", "test design", "test design document", "unit test", "integration test", "api test", "regression test", "quality/test automation framework", "code quality", "code review", "technical document", "english design documents", "basic design document", "detailed design document", "api specification", "specification document", "sonarqube", "junit", "mockito"]
    LANGUAGE_COLLABORATION_KEYWORDS = ["english documentation", "english design documents", "japanese communication", "japanese team collaboration", "collaboration with japanese team", "japan collaboration", "offshore development", "cross-cultural team", "jlpt", "toeic"]
    BONUS_SKILLS_KEYWORDS = ["aws", "docker", "kubernetes", "ci/cd", "redis", "kafka", "performance tuning", "security", "oauth2", "jwt", "playwright"]
    REQUIRED_SKILLS_EXTRA_KEYWORDS = ["java", "spring framework", "spring boot", "spring security", "html", "css", "javascript", "typescript", "sql", "rest api", "full stack", "ui/ux"]

    # Synonym dictionary
    SYNONYM_DICT = {
        "spring framework": ["spring framework", "spring", "spring boot", "spring security", "java spring", "java/spring"],
        "system replacement": ["system replacement", "system replace", "core system modernization", "modernization", "migration", "nâng cấp hệ thống", "chuyển đổi hệ thống", "基幹システム刷新"],
        "retail": ["retail", "store operation", "shop management", "bán lẻ", "vận hành cửa hàng", "quản lý cửa hàng", "小売"],
        "pos": ["pos", "point of sale", "cashier system", "hệ thống tính tiền", "hệ thống pos", "pos連携"],
        "pos integration": ["pos integration", "integrate with pos", "connected to pos", "pos連携"],
        "inventory": ["inventory", "stock management", "quản lý kho", "tồn kho", "在庫"],
        "technical specification": ["technical specification", "design specification", "specifications", "spec", "design doc", "design document", "tài liệu thiết kế", "thiết kế kỹ thuật", "api specification", "api specification document", "basic design document", "detailed design document", "設計書", "英語設計書", "基本設計書", "詳細設計書", "api仕様書"],
        "english design documents": ["english design documents", "english design document", "english basic design document", "english detailed design document", "api specification", "test design document", "英語設計書", "英語の基本設計書"],
        "basic design document": ["basic design document", "基本設計書", "英語の基本設計書"],
        "detailed design document": ["detailed design document", "詳細設計書"],
        "api specification": ["api specification", "api specifications", "api spec", "api仕様書"],
        "test design document": ["test design document", "test design spec", "テスト設計書"],
        "test case design": ["test case design", "designed test case", "design test case", "write test case", "testing scenario", "kịch bản kiểm thử", "thiết kế test case", "test design", "test design document", "テスト設計", "テスト設計書", "system test scenario", "システムテストシナリオ"],
        "system test scenario": ["system test scenario", "system test scenarios", "システムテストシナリオ"],
        "quality/test automation framework": ["quality/test automation framework", "test automation framework", "quality automation framework", "品質・テスト自動化フレームワーク"],
        "integration test": ["integration test", "integration testing", "結合テスト"],
        "api test": ["api test", "api testing", "apiテスト"],
        "code review": ["code review", "peer review", "コードレビュー"],
        "reuse": ["reuse", "reuse business", "second-hand", "pre-owned", "tái sử dụng", "đồ cũ", "リユース"],
        "system design": ["system design", "architecture design", "designing systems", "designed system", "thiết kế hệ thống", "設計"],
        "senior developer": ["senior developer", "senior engineer", "senior full stack", "sr. developer", "sr. engineer"],
        "technical lead": ["technical lead", "tech lead", "lead engineer", "module lead", "mentor", "mentoring", "指導"],
        "architecture design": ["architecture design", "system design", "system replacement", "architecture"],
        "collaboration with japanese team": [
            "japan collaboration",
            "japanese team",
            "japanese client",
            "japanese offshore",
            "offshore development",
            "japanese communication",
            "japan-side collaboration",
            "日本側",
            "日本チーム",
            "日本側との連携",
            "ブリッジSE",
            "日本語",
            "日本語コミュニケーション",
        ],
        "large data processing": ["large data processing", "high volume data", "big data processing", "大規模データ処理"]
    }

    # Action verbs and business contexts for project evidence scoring
    ACTION_VERBS = [
        "design", "develop", "implement", "build", "lead", "optimize", "manage", "deploy", "refactor", "architect", "create", "collaborate", "mentor",
        "thiết kế", "phát triển", "xây dựng", "triển khai", "tối ưu", "quản lý", "vận hành",
        "開発", "設計", "実装", "構築", "導入", "運用", "作成", "最適化", "連携", "指導"
    ]
    BUSINESS_CONTEXTS = [
        "inventory", "pos", "system", "retail", "business", "application", "database", "module", "transaction", "platform",
        "hệ thống", "dự án", "nghiệp vụ", "bán lẻ", "bán hàng", "kho", "giao dịch",
        "システム", "業務", "小売", "店舗", "在庫", "プロジェクト", "基幹システム刷新", "リユース", "pos連携", "大規模データ処理"
    ]


class KeywordMatcher:
    def __init__(self, synonym_dict: Dict[str, List[str]]):
        self.synonym_dict = synonym_dict

    def _normalize(self, text: str) -> str:
        text = (text or "").lower()
        # Replace slash and backslash with spaces to handle unit/integration
        text = text.replace("/", " ").replace("\\", " ").replace("・", " ")
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


def _strip_self_assessment_noise(text: str) -> str:
    if not text:
        return ""
    cleaned_lines = []
    for line in text.splitlines():
        lowered = line.lower()
        if re.search(r"\b\d{1,3}\s*/\s*100\b", lowered) and any(
            marker in lowered
            for marker in ["fit", "match score", "matching score", "self-evaluation", "self evaluation", "self score", "phù hợp", "điểm"]
        ):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def _has_negative_java_spring_evidence(cv_text: str) -> bool:
    cv_clean = (cv_text or "").lower()
    negative_phrases = [
        "basic java/spring",
        "basic spring boot",
        "training app",
        "internal learning project",
        "not yet used in production",
        "not yet used in a large production java system",
        "would need ramp-up",
        "stronger in php/node.js than java/spring",
        "stronger in php/nodejs than java/spring",
        "stronger in php than java",
        "stronger in node than java",
        "stronger in node.js than java",
        "stronger in nodejs than java",
    ]

    cleaned_cv = cv_clean.replace("/", " ").replace(".", "")
    for phrase in negative_phrases:
        if phrase in cv_clean:
            return True
        cleaned_phrase = phrase.replace("/", " ").replace(".", "")
        if cleaned_phrase in cleaned_cv:
            return True
    return False


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
    def __init__(self, action_verbs: List[str], business_contexts: List[str], keyword_matcher: KeywordMatcher):
        self.action_verbs = [v.lower() for v in action_verbs]
        self.business_contexts = [c.lower() for c in business_contexts]
        self.keyword_matcher = keyword_matcher

    def extract_evidence_confidence(self, skill: str, cv_text: str) -> float:
        """
        Detects whether a skill is inside meaningful project/experience descriptions.
        Returns confidence score between 0.5 (just listed) and 1.0 (strong project context).
        """
        skill_norm = _normalize_token(skill)
        if not skill_norm:
            return 0.5

        # Split cv_text into lines/sentences
        lines = [line.strip().lower() for line in re.split(r'[。\.\n•\-*;]', cv_text) if line.strip()]
        
        for line in lines:
            if self.keyword_matcher._match_term(skill, line):
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
        req_matches = " ".join(matched.get("required_skills", [])).lower()
        domain_matches = " ".join(matched.get("project_domain", [])).lower()
        testing_matches = " ".join(matched.get("testing_documentation", [])).lower()
        language_matches = " ".join(matched.get("language_collaboration", [])).lower()
        bonus_matches = " ".join(matched.get("bonus_skills", [])).lower()

        req_score = sub_scores.get("required_skills", 0)
        if req_score >= 80:
            if any(term in req_matches for term in ["java", "spring"]):
                strengths.append("senior Java/Spring experience")
            else:
                strengths.append("strong core technical skill match")
        elif req_score < 50:
            weaknesses.append("thiếu nhiều kỹ năng chuyên môn bắt buộc")

        proj_score = sub_scores.get("project_domain", 0)
        if proj_score >= 75:
            if any(term in domain_matches for term in ["retail", "pos", "reuse", "inventory", "system replacement", "pos integration"]):
                strengths.append("retail/POS/reuse domain evidence")
            else:
                strengths.append("strong domain relevance")
        elif proj_score < 40:
            weaknesses.append("kinh nghiệm dự án trong lĩnh vực tương tự còn hạn chế")

        if years_experience >= 5:
            if "senior Java/Spring experience" not in strengths:
                strengths.append(f"{years_experience:g} years of relevant experience")
        elif years_experience > 0 and years_experience < 3:
            weaknesses.append(f"số năm kinh nghiệm thực tế còn ít ({years_experience:g} năm)")

        test_score = sub_scores.get("testing_documentation", 0)
        if test_score >= 80:
            if any(term in testing_matches for term in ["english design documents", "basic design document", "detailed design document", "api specification", "test design document"]):
                strengths.append("English design/API/test documentation")
            if any(term in testing_matches for term in ["system test", "system test scenario", "integration test", "api test", "junit", "mockito", "sonarqube", "quality/test automation framework", "code review"]):
                strengths.append("system testing and QA automation")
            if not any(term in testing_matches for term in ["english design documents", "basic design document", "detailed design document", "api specification", "test design document", "system test", "integration test", "api test", "junit", "mockito", "sonarqube"]):
                strengths.append("strong testing and documentation evidence")
        elif test_score < 40:
            weaknesses.append("missing testing or documentation experience")

        lang_score = sub_scores.get("language_collaboration", 0)
        if lang_score >= 70:
            if any(term in language_matches for term in ["collaboration with japanese team", "japanese team collaboration", "japanese communication", "japan collaboration", "jlpt", "toeic"]):
                strengths.append("Japan-side collaboration")
            else:
                strengths.append("strong language and collaboration evidence")
        elif lang_score < 35 and missing.get("language_collaboration"):
            weaknesses.append("thiếu bằng chứng rõ ràng về ngoại ngữ hoặc phối hợp đa quốc gia")

        if sub_scores.get("bonus_skills", 0) >= 70 and any(term in bonus_matches for term in ["aws", "docker", "kubernetes", "kafka", "redis", "ci/cd"]):
            strengths.append("strong platform and DevOps bonus skills")

        strengths = _dedupe(strengths)
        weaknesses = _dedupe(weaknesses)

        if strengths and weaknesses:
            return f"Strengths: {', '.join(strengths)}. Weaknesses: {', '.join(weaknesses)}."
        if strengths:
            return f"Strengths: {', '.join(strengths)}."
        if weaknesses:
            return f"Weaknesses: {', '.join(weaknesses)}."
        return "Balanced match with limited explicit evidence."


def _extract_stack_experience_years(cv_text: str, jd_text: str) -> float:
    core_techs = ["java", "spring", "python", "django", "react", "angular", "vue", "nodejs", "node.js", "php", "laravel", "c#", ".net"]
    jd_lower = jd_text.lower()
    required_techs = [tech for tech in core_techs if tech in jd_lower]
    
    if not required_techs:
        return extract_experience_years(cv_text)
        
    cv_lower = cv_text.lower()
    segments = re.split(r'[。\.\n•\-*;]', cv_lower)
    stack_years = []
    for segment in segments:
        segment = segment.strip()
        if not segment:
            continue
        if any(tech in segment for tech in required_techs):
            years = [float(val) for val in re.findall(r"(\d+(?:\.\d+)?)\s*\+?\s+years?", segment)]
            years.extend(float(val) for val in re.findall(r"(\d+(?:\.\d+)?)\s*年以上", segment))
            years.extend(float(val) for val in re.findall(r"(\d+(?:\.\d+)?)\s*年(?:間)?", segment))
            years = [value for value in years if 0.0 < value <= 50.0]
            if years:
                stack_years.extend(years)
                
    if stack_years:
        return max(stack_years)
    total_years = extract_experience_years(cv_text)
    req_years = _required_experience_years(jd_text)
    matched_techs = [tech for tech in required_techs if tech in cv_lower]
    if total_years >= max(7.0, req_years + 2.0) and len(matched_techs) >= 2:
        return total_years
    return 0.0


class CriteriaScoringService:
    def __init__(self, config: ScoringWeightsConfig, alpha: float = 0.7):
        self.config = config
        self.keyword_matcher = KeywordMatcher(config.SYNONYM_DICT)
        self.semantic_matcher = SemanticMatcher(alpha=alpha)
        self.evidence_extractor = EvidenceExtractor(config.ACTION_VERBS, config.BUSINESS_CONTEXTS, self.keyword_matcher)

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

        matched_norm = {_normalize_token(item) for item in matched_kws}
        frontend_terms = {"html", "css", "javascript", "typescript"}
        frontend_hits = len(frontend_terms.intersection(matched_norm))
        strong_hits = sum(1 for confidence in evidence_scores if confidence >= 0.8)
        has_java_spring = "java" in matched_norm and bool({"spring framework", "spring boot", "spring security", "spring"}.intersection(matched_norm))
        stack_years = _extract_stack_experience_years(cv_text, jd_text)
        has_negative_java_spring = _has_negative_java_spring_evidence(cv_text)

        if (
            has_java_spring
            and frontend_hits >= 3
            and stack_years >= 5.0
            and not has_negative_java_spring
        ):
            calibrated_floor = 82.0
            if frontend_hits >= 3 and strong_hits >= 4:
                calibrated_floor = 86.0
            if stack_years >= 8.0 and strong_hits >= 5:
                calibrated_floor = 88.0
            final_sub_score = max(final_sub_score, calibrated_floor)

        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_project_domain(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 30% keyword match + 70% semantic match
        keywords = jd_keywords if jd_keywords else self.config.PROJECT_DOMAIN_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0
        evidence_scores = [self.evidence_extractor.extract_evidence_confidence(kw, cv_text) for kw in matched_kws]
        strong_hits = sum(1 for confidence in evidence_scores if confidence >= 0.8)

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.3 * kw_score + 0.7 * sem_score

        # Treat retail terms without POS/core-system/system-replacement evidence as weak domain evidence.
        # If the CV explicitly says "No direct POS integration", reduce project_domain score.
        cv_clean = cv_text.lower()
        has_retail = any(term in cv_clean for term in ["retail", "bán lẻ", "store operation", "shop management", "vận hành cửa hàng", "小売", "リユース"])
        has_pos_evidence = any(term in cv_clean for term in ["pos", "point of sale", "pos連携", "core system", "system replacement", "modernization", "migration", "chuyển đổi hệ thống", "nâng cấp hệ thống", "基幹システム刷新"])
        if has_retail and not has_pos_evidence:
            final_sub_score = min(50.0, final_sub_score * 0.7)
            if "weak domain evidence" not in missing_kws:
                missing_kws.append("weak domain evidence (retail without POS/core-system/system-replacement evidence)")

        if "no direct pos integration" in cv_clean or "no direct pos" in cv_clean:
            final_sub_score = min(40.0, final_sub_score * 0.5)
            if "no direct POS integration" not in missing_kws:
                missing_kws.append("no direct POS integration")

        if (
            len(matched_kws) >= 4
            and strong_hits >= 3
            and any(term in {_normalize_token(item) for item in matched_kws} for term in ["retail", "pos", "inventory", "reuse", "system replacement", "large data processing"])
            and "no direct POS integration" not in missing_kws
        ):
            calibrated_floor = 82.0
            if len(matched_kws) >= 5 and strong_hits >= 4:
                calibrated_floor = 85.0
            if len(matched_kws) >= 6 and strong_hits >= 4:
                calibrated_floor = 88.0
            final_sub_score = max(final_sub_score, calibrated_floor)

        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_responsibility(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 50% keyword match + 50% semantic match
        keywords = jd_keywords if jd_keywords else self.config.RESPONSIBILITY_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.5 * kw_score + 0.5 * sem_score
        if kw_score >= 90.0:
            final_sub_score = max(final_sub_score, 85.0)
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_testing_documentation(self, cv_text: str, jd_text: str, jd_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        # 60% keyword match + 40% semantic match
        keywords = jd_keywords if jd_keywords else self.config.TESTING_DOCUMENTATION_KEYWORDS
        matched_kws, missing_kws = self.keyword_matcher.match_unique_keywords(keywords, cv_text)
        kw_score = (len(matched_kws) / len(keywords) * 100.0) if keywords else 0.0

        evidence_scores = []
        for kw in matched_kws:
            confidence = self.evidence_extractor.extract_evidence_confidence(kw, cv_text)
            evidence_scores.append(confidence)

        if evidence_scores:
            strong_hits = sum(1 for confidence in evidence_scores if confidence >= 0.8)
            evidence_mult = (sum(0.9 + 0.25 * confidence for confidence in evidence_scores) / len(evidence_scores))
            kw_score = min(100.0, kw_score * evidence_mult)
            if strong_hits >= 4:
                kw_score = max(kw_score, 85.0)

        sem_sim = self.semantic_matcher.score_similarity(cv_text, jd_text)
        sem_score = max(0.0, min(100.0, sem_sim * 100.0))

        final_sub_score = 0.6 * kw_score + 0.4 * sem_score
        return round(max(0.0, min(100.0, final_sub_score)), 1), matched_kws, missing_kws

    def score_seniority(self, cv_text: str, jd_text: str) -> Tuple[float, List[str], List[str]]:
        # Seniority relies on experience years + keywords
        req_years = _required_experience_years(jd_text)
        cand_total_years = extract_experience_years(cv_text)
        cand_stack_years = _extract_stack_experience_years(cv_text, jd_text)
        
        # If total years is >= 5 but stack-specific years is less than required years,
        # we do not give full seniority credit and use stack years instead.
        if cand_total_years >= 5.0 and req_years >= 5.0 and cand_stack_years < req_years:
            cand_years = cand_stack_years
        else:
            cand_years = cand_total_years
        
        matched = []
        missing = []
        
        # Base score from years matching
        if req_years <= 0:
            years_score = 70.0  # default baseline if no years specified
        else:
            if cand_years >= req_years:
                years_score = 100.0
                matched.append(f"{cand_years:g} years of stack-relevant experience (required: {req_years:g})")
            elif cand_years > 0:
                years_score = (cand_years / req_years) * 100.0
                matched.append(f"{cand_years:g} years of stack-relevant experience")
                missing.append(f"required: {req_years:g} years of stack-relevant experience")
            else:
                years_score = 0.0
                missing.append(f"required: {req_years:g} years of stack-relevant experience")

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
        matched_norm = {_normalize_token(item) for item in matched_kws}
        evidence_scores = [self.evidence_extractor.extract_evidence_confidence(kw, cv_text) for kw in matched_kws]
        strong_hits = sum(1 for confidence in evidence_scores if confidence >= 0.8)
        if (
            "english design documents" in matched_norm
            and ("japan collaboration" in matched_norm or "collaboration with japanese team" in matched_norm)
        ):
            final_sub_score = max(final_sub_score, 85.0)
        elif (
            ("jlpt" in matched_norm or "toeic" in matched_norm)
            and ("japan collaboration" in matched_norm or "collaboration with japanese team" in matched_norm)
        ):
            final_sub_score = max(final_sub_score, 80.0)
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

    @staticmethod
    def _flatten_points(grouped_points: Dict[str, List[str]], section_order: List[str], limit: int = 24) -> List[str]:
        points: List[str] = []
        seen = set()
        for key in section_order:
            for item in grouped_points.get(key, []):
                normalized = _normalize_token(item)
                if not normalized or normalized in seen:
                    continue
                points.append(item)
                seen.add(normalized)
                if len(points) >= limit:
                    return points
        return points

    @staticmethod
    def _build_sections(
        sub_scores: Dict[str, float],
        matched: Dict[str, List[str]],
        missing_or_weak: Dict[str, List[str]],
        reasoning_summary: str,
    ) -> List[Dict[str, Any]]:
        labels = {
            "required_skills": "Required Skills Match",
            "project_domain": "Project / Domain Relevance",
            "seniority": "Years of Experience / Seniority",
            "responsibility": "Responsibility Match",
            "testing_documentation": "Testing / Documentation / Quality Evidence",
            "language_collaboration": "Language / Collaboration",
            "bonus_skills": "Bonus Skills",
        }
        order = [
            "required_skills",
            "project_domain",
            "seniority",
            "responsibility",
            "testing_documentation",
            "language_collaboration",
            "bonus_skills",
        ]
        return [
            {
                "key": key,
                "label": labels[key],
                "score": sub_scores.get(key),
                "good": matched.get(key, []),
                "missing": missing_or_weak.get(key, []),
                "explanation": reasoning_summary,
            }
            for key in order
        ]

    @staticmethod
    def _build_must_have(demands: Dict[str, List[str]], matched: Dict[str, List[str]], missing_or_weak: Dict[str, List[str]]) -> Dict[str, Any]:
        priority_order = ["required_skills", "project_domain", "seniority", "language_collaboration"]
        candidates: List[str] = []
        seen = set()
        for key in priority_order:
            for item in demands.get(key, [])[:3]:
                normalized = _normalize_token(item)
                if not normalized or normalized in seen:
                    continue
                candidates.append(item)
                seen.add(normalized)

        matched_lookup = {
            key: {_normalize_token(item) for item in values}
            for key, values in matched.items()
        }
        missing_lookup = {
            key: {_normalize_token(item) for item in values}
            for key, values in missing_or_weak.items()
        }

        matched_items: List[str] = []
        missing_items: List[str] = []
        for item in candidates:
            normalized = _normalize_token(item)
            source_key = next((key for key in priority_order if normalized in {_normalize_token(term) for term in demands.get(key, [])}), None)
            if source_key and normalized in matched_lookup.get(source_key, set()):
                matched_items.append(item)
            elif source_key and normalized in missing_lookup.get(source_key, set()):
                missing_items.append(item)

        return {
            "matched": matched_items,
            "missing": missing_items,
            "penalty_applied": 0,
        }

    @staticmethod
    def _jd_focus_text(text: str) -> str:
        if not text:
            return ""
        main_text = re.split(r"\bquyền lợi\b", text, maxsplit=1, flags=re.I)[0]
        keyword_match = re.search(r"(từ khóa đánh giá cv|cv keywords?|keywords?)\s*[:\-]?\s*(.+)$", text, flags=re.I | re.S)
        keyword_text = keyword_match.group(2).strip() if keyword_match else ""
        return "\n".join(part for part in [main_text.strip(), keyword_text] if part).strip()

    def _extract_required_skill_demands(self, text: str) -> List[str]:
        focus_text = self._jd_focus_text(text)
        candidates = _dedupe(self.config.REQUIRED_SKILLS_KEYWORDS + self.config.REQUIRED_SKILLS_EXTRA_KEYWORDS)
        extracted = [term for term in candidates if self.criteria_service.keyword_matcher._match_term(term, focus_text)]
        if not extracted:
            extracted = list(self.config.REQUIRED_SKILLS_KEYWORDS)
        return _dedupe(extracted)

    def parse_demands_from_text(self, text: str) -> Dict[str, List[str]]:
        """
        Parses requirements and preferred lists directly from JD text for keyword matching.
        """
        aliases = load_aliases()
        alias_index = _load_alias_index(aliases)
        normalized_text = text or ""
        focus_text = self._jd_focus_text(normalized_text)
        
        # 1. Required skills (Technical skills + programming languages)
        extracted_skills = self._extract_required_skill_demands(normalized_text)
        
        # 2. Bonus skills
        # Look for typical devops / advanced keywords in text
        bonus_terms = ["aws", "docker", "kubernetes", "ci/cd", "redis", "kafka", "playwright"]
        extracted_bonus = [term for term in bonus_terms if self.criteria_service.keyword_matcher._match_term(term, focus_text)]
        
        # 3. Languages
        extracted_languages = [term for term in self.config.LANGUAGE_COLLABORATION_KEYWORDS if self.criteria_service.keyword_matcher._match_term(term, focus_text)]
        
        # 4. Project/Domain
        # Look for domain words
        extracted_domain = [term for term in self.config.PROJECT_DOMAIN_KEYWORDS if self.criteria_service.keyword_matcher._match_term(term, focus_text)]
        
        # 5. Responsibility
        extracted_resp = [term for term in self.config.RESPONSIBILITY_KEYWORDS if self.criteria_service.keyword_matcher._match_term(term, focus_text)]
        
        # 6. Testing / Documentation
        extracted_testing = [term for term in self.config.TESTING_DOCUMENTATION_KEYWORDS if self.criteria_service.keyword_matcher._match_term(term, focus_text)]

        return {
            "required_skills": extracted_skills if extracted_skills else self.config.REQUIRED_SKILLS_KEYWORDS,
            "project_domain": extracted_domain if extracted_domain else self.config.PROJECT_DOMAIN_KEYWORDS,
            "responsibility": extracted_resp if extracted_resp else self.config.RESPONSIBILITY_KEYWORDS,
            "testing_documentation": extracted_testing if extracted_testing else self.config.TESTING_DOCUMENTATION_KEYWORDS,
            "language_collaboration": extracted_languages if extracted_languages else self.config.LANGUAGE_COLLABORATION_KEYWORDS,
            "bonus_skills": extracted_bonus if extracted_bonus else self.config.BONUS_SKILLS_KEYWORDS,
        }

    def score_cv_vs_jd(self, cv_text: str, jd_text: str, custom_weights: Dict[str, float] = None) -> Dict[str, Any]:
        cv_text = _strip_self_assessment_noise(cv_text)
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

        # Check if the JD requires Senior Java/Spring
        jd_clean = jd_text.lower()
        requires_java_spring = any(kw in demands["required_skills"] for kw in ["java", "spring", "springboot"]) or "java" in jd_clean or "spring" in jd_clean
        is_senior_jd = any(kw in jd_clean for kw in ["senior", "lead", "5+ years", "5 years", "6+ years", "6 years", "experienced"])
        
        # Check for negative Java/Spring evidence
        cv_clean = cv_text.lower()
        negative_phrases = [
            "basic java/spring",
            "basic spring boot",
            "training app",
            "internal learning project",
            "not yet used in production",
            "not yet used in a large production java system",
            "would need ramp-up",
            "stronger in php/node.js than java/spring",
            "stronger in php/nodejs than java/spring",
            "stronger in php than java",
            "stronger in node than java",
            "stronger in node.js than java",
            "stronger in nodejs than java"
        ]
        
        has_negative_evidence = _has_negative_java_spring_evidence(cv_text)

        if requires_java_spring and is_senior_jd and has_negative_evidence:
            req_score = min(55.0, req_score)
            sub_scores["required_skills"] = req_score
            if "only basic/training Java/Spring evidence found" not in req_missing:
                req_missing.append("only basic/training Java/Spring evidence found")

        # Final Score calculation
        final_score = sum(sub_scores[k] * weights[k] for k in weights)
        if requires_java_spring and is_senior_jd and has_negative_evidence:
            final_score = min(60.0, final_score)
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

        section_order = [
            "required_skills",
            "project_domain",
            "seniority",
            "responsibility",
            "testing_documentation",
            "language_collaboration",
            "bonus_skills",
        ]
        sections = self._build_sections(sub_scores, matched, missing_or_weak, reasoning_summary)
        good_points = self._flatten_points(matched, section_order)
        missing_points = self._flatten_points(missing_or_weak, section_order)
        must_have = self._build_must_have(demands, matched, missing_or_weak)
        summary = {
            "good_count": len(good_points),
            "missing_count": len(missing_points),
            "must_have_matched_count": len(must_have["matched"]),
            "must_have_missing_count": len(must_have["missing"]),
        }

        return {
            "finalScore": final_score,
            "subScores": sub_scores,
            "matched": matched,
            "missingOrWeak": missing_or_weak,
            "reasoningSummary": reasoning_summary,
            "sections": sections,
            "good_points": good_points,
            "missing_points": missing_points,
            "must_have": must_have,
            "summary": summary,
        }
