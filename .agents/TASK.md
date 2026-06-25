# Token & execution rules

- Be concise. No filler. Direct answers only.
- Work in one pass when requirements are clear.
- Ask only if a required business rule, schema relation, or file path is missing.
- Do not edit files outside the allowed paths. If needed, stop and explain why.
- Do not rewrite whole files unless unavoidable.
- Prefer small targeted diffs: modified functions, added helpers, or changed constants only.
- Do not generate boilerplate, setup files, or repetitive configs unless required.
- Do not change human labels, evaluation data, or report files unless explicitly asked.
- Do not fake metrics, test results, or scores.
- Preserve existing behaviour unless the task explicitly targets that behaviour.
- Keep code readable; do not overuse shorthand if it harms clarity.
- For Python, prefer explicit readable logic.
- For TypeScript/React, concise modern syntax is acceptable.
- Always report changed files, commands run, and final result.
- If tests fail, show the failing command and root cause only.
- If a fix requires multiple architectural layers, give a 3-bullet plan and wait.Replace method Y` to indicate code placement.

Repo: https://github.com/Sadfatcat/Intelligent-CV-Screening-and-Recruitment-Management

Task: improve CV-JD matcher scoring calibration, not just thresholds.

Problem:
Cross-pair evaluation shows ranking may be acceptable, but absolute scores are too conservative. Many human-labelled High cases receive system_score < 50, so classification accuracy is low with normal thresholds:
High >= 80, Medium 50-79, Low < 50.
Goal is to improve scoring logic so strong matches score higher while Low cases remain low.

Use provided evaluation files:
- mau_gan_nhan_crosspair_labelled.csv = human ground truth. Do NOT edit labels.
- ung_vien_crosspair.csv = current system scores/evidence.
- danh_sach_cv_mock.csv
- danh_sach_jd_mock.csv
- quy_tac_ghep_cap_crosspair.md

Primary files to inspect/edit:
1. backend/app/services/matcher.py
   - lines ~18-48: DEFAULT_ALPHA_MAP, DEFAULT_WEIGHTS
   - lines ~300-617: parsing, extraction, TF-IDF/embedding similarity, parse_sections_cv/jd
   - lines ~620-979: _extract_demands_from_jd, _extract_evidence_from_cv, _section_result, rule_based_checks, _infer_must_have, score_cv_vs_jd
2. backend/app/services/skill_aliases.json
   - expand aliases only if missing important variants.
3. backend/tests/test_matcher_simple.py
   - update/add tests if scoring behaviour changes.
4. evaluation script if already exists; otherwise create:
   tools/evaluate_crosspair_matching.py
   or backend/scripts/evaluate_crosspair_matching.py

Rules:
- Do NOT edit thesis/report files.
- Do NOT change human_label, human_relevance, or reason.
- Do NOT fake metrics.
- Do NOT only change thresholds.
- Do NOT inflate all scores blindly.
- Keep score in 0-100.
- Keep matcher explainable: good_points, missing_points, section scores should still make sense.
- Preserve existing tests.

Required workflow:
1. Run current cross-pair evaluation as baseline using mau_gan_nhan_crosspair_labelled.csv.
2. Save baseline:
   - accuracy
   - average score by human_label
   - Precision@3
   - Recall@3
   - NDCG@3
3. Diagnose why High cases get low scores.
4. Improve matcher.py with minimal focused changes:
   - strengthen required/core skill overlap scoring
   - separate required vs preferred skills more clearly
   - give partial experience credit instead of hard pass/fail
   - reduce over-dependence on TF-IDF for skill-heavy sections
   - improve must-have penalty so required skills matter, preferred skills are lighter
   - add simple role/domain compatibility only if safe
   - expand skill aliases if needed
5. Re-run cross-pair evaluation.
6. Compare before/after metrics.
7. Run backend tests.

Acceptance criteria:
- Average score for human_label=High increases clearly.
- Average score for Low remains low.
- Accuracy improves.
- Precision@3 and NDCG@3 do not collapse.
- No human labels changed.
- No report files changed.
- Tests still pass.

Expected final response:
- Root cause of low absolute scores.
- Files changed with paths.
- Scoring formula changes.
- Before/after metrics table.
- Test command and result.
- Any remaining limitation, especially score calibration if still imperfect.

/home/dat/intelligent_cv_screening/evaluation for evaluation 

Execution mode:
Work in one pass to save tokens. First run the baseline evaluation, then implement focused matcher improvements, then rerun evaluation and tests. Do not stop for confirmation unless a required change touches files outside the allowed list.

Allowed files:
- backend/app/services/matcher.py
- backend/app/services/skill_aliases.json
- backend/tests/test_matcher_simple.py
- tools/evaluate_crosspair_matching.py
- backend/scripts/evaluate_crosspair_matching.py
- evaluation output CSV/MD files

Forbidden:
- thesis/report files
- frontend UI files
- database schema files
- auth/security files
- API route files unless explicitly required

If you need to edit any other file, stop and explain why before changing it.