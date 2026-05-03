import sys
import importlib

sys.path.insert(0, '..')

def run():
    mod = importlib.import_module('tests.test_matcher_simple')
    # if imported, running __main__ block won't execute, so call tests directly
    funcs = [fn for name, fn in vars(mod).items() if callable(fn) and name.startswith('test_')]
    for f in funcs:
        f()
    print('all tests passed')


if __name__ == '__main__':
    run()
