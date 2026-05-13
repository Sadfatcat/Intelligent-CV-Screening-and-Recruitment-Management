import sys
import importlib
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_MODULES = [
    'tests.test_auth_routes',
    'tests.test_admin_routes',
    'tests.test_matcher_simple',
    'tests.test_matching_config',
    'tests.test_models_schema',
    'tests.test_jobs_matching_config',
    'tests.test_cvs_upload',
    'tests.test_recruiter_matching_detail',
    'tests.test_recruiter_permissions_and_delete_risk',
]

def run():
    for module_name in TEST_MODULES:
        mod = importlib.import_module(module_name)
        funcs = [fn for name, fn in vars(mod).items() if callable(fn) and name.startswith('test_')]
        for f in funcs:
            f()
    print('all tests passed')


if __name__ == '__main__':
    run()
