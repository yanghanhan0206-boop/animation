"""Shot registry. Each shot class: name, dur (s), fps, build(), frame(t, i)."""
import importlib

MODULES = ['dorm_shots', 'interview', 'pool']
_REG = {}


def _load():
    if _REG:
        return
    for m in MODULES:
        mod = importlib.import_module('shots.' + m)
        for k in dir(mod):
            c = getattr(mod, k)
            if isinstance(c, type) and getattr(c, 'name', None) and hasattr(c, 'frame'):
                _REG[c.name] = c


def get(name):
    _load()
    return _REG[name]


def all_shots():
    _load()
    return dict(_REG)
