from __future__ import annotations

import os
import time
from contextlib import contextmanager
from typing import Dict, Iterator, Optional


def debug_enabled() -> bool:
    return os.getenv("FACE_SERVICE_DEBUG", "false").lower() in {"1", "true", "yes", "on"}


@contextmanager
def timed(name: str) -> Iterator[Dict[str, float]]:
    start = time.perf_counter()
    payload: Dict[str, float] = {}
    try:
        yield payload
    finally:
        payload[name] = (time.perf_counter() - start) * 1000.0


def safe_int(v: Optional[object], default: int = 0) -> int:
    try:
        return int(v)  # type: ignore[arg-type]
    except Exception:
        return default

