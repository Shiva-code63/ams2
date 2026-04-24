from __future__ import annotations

import logging
import os
import tempfile
import sys
from typing import Optional, Tuple

import cv2
import numpy as np

from utils.errors import FaceServiceError

log = logging.getLogger("deepface")


def _ensure_utf8_stdout() -> None:
    """
    DeepFace's logger prints unicode symbols on some code paths (e.g. download messages).
    On Windows with a non-UTF8 console encoding, this can raise UnicodeEncodeError and abort
    model loading. Make stdout/stderr UTF-8 when possible.
    """

    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    except Exception:
        pass


def warmup_deepface() -> None:
    """
    Warm up DeepFace models once at startup.

    This avoids the first request paying for model construction and weight download.
    """
    _ensure_utf8_stdout()
    from deepface import DeepFace

    DeepFace.build_model("ArcFace")

    # Best-effort: initialize RetinaFace backend. Some DeepFace versions expose extract_faces; others don't.
    try:
        dummy = np.zeros((224, 224, 3), dtype=np.uint8)
        if hasattr(DeepFace, "extract_faces"):
            DeepFace.extract_faces(
                img_path=dummy,
                detector_backend="retinaface",
                enforce_detection=False,
                align=True,
            )
    except Exception:
        pass


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    va = np.asarray(a, dtype=np.float32).reshape(-1)
    vb = np.asarray(b, dtype=np.float32).reshape(-1)
    na = float(np.linalg.norm(va))
    nb = float(np.linalg.norm(vb))
    if na <= 1e-8 or nb <= 1e-8:
        return 0.0
    return float(np.dot(va, vb) / (na * nb))


def _l2_normalize(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=np.float32).reshape(-1)
    n = float(np.linalg.norm(v))
    if n <= 1e-8:
        return v
    return (v / n).astype(np.float32, copy=False)


def _represent_with_fallback(img_bgr: np.ndarray) -> list:
    """
    DeepFace accepts either a path or a numpy array depending on version.

    For maximum compatibility, try in-memory first, then fall back to a temp file.
    """
    _ensure_utf8_stdout()
    from deepface import DeepFace

    try:
        return DeepFace.represent(
            img_path=img_bgr,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=True,
            align=True,
        )
    except Exception:
        with tempfile.NamedTemporaryFile(prefix="arcface_", suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            ok = cv2.imwrite(tmp_path, img_bgr)
            if not ok:
                raise FaceServiceError.internal("Failed to write temp image")
            return DeepFace.represent(
                img_path=tmp_path,
                model_name="ArcFace",
                detector_backend="retinaface",
                enforce_detection=True,
                align=True,
            )
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass


def extract_single_arcface_embedding(img_bgr: np.ndarray) -> np.ndarray:
    """
    Detect (RetinaFace) + align + embed (ArcFace).

    Rejects multiple faces and no-face images.
    Returns an L2-normalized float32 embedding vector.
    """
    if img_bgr is None or img_bgr.size == 0:
        raise FaceServiceError.bad_request("Invalid image")

    try:
        out = _represent_with_fallback(img_bgr)
    except FaceServiceError:
        raise
    except Exception as ex:
        # DeepFace raises different exception types depending on backend/version.
        msg_raw = str(ex)
        msg = msg_raw.lower()

        # Common in locked-down environments: DeepFace can't download weights at runtime.
        if "consider downloading it manually" in msg and ("arcface_weights" in msg or "retinaface" in msg):
            raise FaceServiceError.internal(
                "Model weights missing (ArcFace/RetinaFace). Download weights manually and place them in DeepFace weights directory.",
                details={"reason": msg_raw},
            )
        if "more than one face" in msg or "multiple faces" in msg:
            raise FaceServiceError.bad_request("Multiple faces detected")
        if "face could not be detected" in msg or "no face" in msg or "could not detect" in msg:
            raise FaceServiceError.bad_request("No face detected")
        log.exception("DeepFace represent failed")
        raise FaceServiceError.internal("Face embedding failed", details={"reason": msg_raw})

    if not out:
        raise FaceServiceError.bad_request("No face detected")

    # DeepFace.represent typically returns a list of dicts (one per detected face).
    if isinstance(out, list) and len(out) != 1:
        raise FaceServiceError.bad_request("Multiple faces detected")

    first = out[0] if isinstance(out, list) else out
    if not isinstance(first, dict):
        raise FaceServiceError.internal("Unexpected embedding output format")

    emb = first.get("embedding")
    if emb is None:
        raise FaceServiceError.internal("Failed to extract face embedding")

    return _l2_normalize(np.asarray(emb, dtype=np.float32))


def best_similarity_against_registered(
    probe_embeddings: list[np.ndarray],
    registered_embedding: np.ndarray,
) -> Tuple[float, Optional[int]]:
    if not probe_embeddings:
        return 0.0, None

    reg = _l2_normalize(np.asarray(registered_embedding, dtype=np.float32))
    best = -1.0
    best_idx: Optional[int] = None
    for i, emb in enumerate(probe_embeddings):
        sim = cosine_similarity(_l2_normalize(emb), reg)
        if sim > best:
            best = sim
            best_idx = i
    return float(best), best_idx
