CV/JD Matching Pipeline (short)

- What I added:
  - `app/services/matcher.py`: parsing, regex extraction, skill mapping, TF-IDF + embedding similarity (with fallbacks), rule-based checks, weighted scoring.
  - `app/services/skill_aliases.json`: small alias dictionary.
  - `app/services/pipeline_demo.py`: demo runner.
  - `tests/test_matcher_simple.py` and `tests/run_tests.py`: simple unit tests and runner.

- How to run tests locally (from repo root):

```bash
python3 -c "import sys; sys.path.insert(0,'backend'); from tests.run_tests import run; run()"
```

- Notes:
  - Embedding via `sentence-transformers` is used if available; otherwise code falls back to TF-IDF or token-overlap.
  - TF-IDF requires `scikit-learn`; if absent, a token-overlap Jaccard fallback is used.
