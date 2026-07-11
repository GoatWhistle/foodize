import sys
from pathlib import Path

_BACKEND_PATH = str(Path(__file__).resolve().parent.parent.parent / "src" / "backend")
if _BACKEND_PATH not in sys.path:
    sys.path.insert(0, _BACKEND_PATH)
