from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from typing import List, Optional, Tuple
from uuid import uuid4

import numpy as np
from fastapi import UploadFile

from utils.debug_utils import debug_enabled, timed
from utils.deepface_utils import cosine_similarity, extract_single_arcface_embedding
from utils.errors import FaceServiceError
from utils.image_utils import check_blur, check_brightness, decode_image
from utils.liveness_utils import run_liveness_checks

log = logging.getLogger("face_service")


_USER_ID_RE = re.compile(r"^[a-zA-Z0-9_.-]{1,128}$")


@dataclass(frozen=True)
class _FrameScore:
    score: float
    img_bgr: np.ndarray


class FaceService:
    """
    Face recognition service:
    - Detection: RetinaFace (via DeepFace)
    - Alignment: automatic (via DeepFace)
    - Embedding: ArcFace (via DeepFace)
    - Comparison: cosine similarity

    Registered embeddings are stored as .npy files at: uploads/faces/{userId}.npy
    """

    def __init__(self) -> None:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.service_root = base_dir
        self.uploads_dir = os.getenv("FACE_SERVICE_UPLOAD_DIR", os.path.join(base_dir, "uploads", "faces"))
        os.makedirs(self.uploads_dir, exist_ok=True)

        self.min_brightness = float(os.getenv("FACE_SERVICE_MIN_BRIGHTNESS", "55.0"))
        self.min_blur_var = float(os.getenv("FACE_SERVICE_MIN_BLUR_VAR", "80.0"))

        # Cosine similarity threshold (higher = stricter). ArcFace commonly works well around 0.4–0.6.
        self.similarity_threshold = float(os.getenv("FACE_SERVICE_SIMILARITY_THRESHOLD", "0.5"))

        # Optional liveness checks (expects a short frame sequence).
        self.enable_liveness = os.getenv("FACE_SERVICE_ENABLE_LIVENESS", "false").lower() in {"1", "true", "yes", "on"}

        # Hard limits to keep latency bounded if clients send many frames.
        self.max_verify_frames = int(os.getenv("FACE_SERVICE_MAX_VERIFY_FRAMES", "12"))
        self.max_register_images = int(os.getenv("FACE_SERVICE_MAX_REGISTER_IMAGES", "5"))

    async def register_face(self, user_id: str, files: List[UploadFile]):
        user_id = self._validate_user_id(user_id)

        if not files:
            raise FaceServiceError.bad_request("image file is required")
        if len(files) > self.max_register_images:
            raise FaceServiceError.bad_request(f"Upload at most {self.max_register_images} images")

        embeddings: List[np.ndarray] = []
        rejected: List[str] = []

        timings: dict[str, float] = {}
        for idx, upload in enumerate(files, start=1):
            if upload is None:
                rejected.append(f"Image {idx}: missing file")
                continue

            raw = await upload.read()
            if not raw:
                rejected.append(f"Image {idx}: empty file")
                continue

            try:
                frame = decode_image(raw)
                if debug_enabled():
                    log.info(
                        "Register recv userId=%s idx=%s filename=%s bytes=%s shape=%s blurVar=%.2f brightness=%.2f",
                        user_id,
                        idx,
                        upload.filename,
                        len(raw),
                        frame.shape,
                        check_blur(frame),
                        check_brightness(frame),
                    )

                self._validate_quality_or_throw(frame)

                with timed(f"embed{idx}Ms") as t:
                    emb = extract_single_arcface_embedding(frame)
                timings.update(t)
                embeddings.append(emb)
            except FaceServiceError as ex:
                rejected.append(f"Image {idx}: {ex.message}")
            except Exception as ex:
                log.exception("Failed to process registration image %s for userId=%s", idx, user_id)
                rejected.append(f"Image {idx}: failed to process ({str(ex)})")

        if not embeddings:
            raise FaceServiceError.bad_request(
                "Registration failed: no valid face images",
                details={"accepted": 0, "rejectedReasons": rejected},
            )

        # Average embeddings when multiple images are provided, then L2 normalize.
        mean_emb = np.mean(np.stack(embeddings, axis=0), axis=0).astype(np.float32, copy=False)
        mean_emb = self._l2_normalize(mean_emb)

        out_path = self._embedding_path(user_id)
        self._atomic_save_npy(out_path, mean_emb)

        payload = {
            "userId": user_id,
            "saved": True,
            "embeddingPath": os.path.relpath(out_path, start=self.service_root),
            "accepted": int(len(embeddings)),
            "rejected": int(len(rejected)),
            "rejectedReasons": rejected,
            "message": "Face registered successfully",
        }
        if debug_enabled():
            payload["debug"] = {"timings": timings, "embeddingDim": int(mean_emb.shape[0])}
        return payload

    async def verify_face(
        self,
        user_id: str,
        frames: Optional[List[UploadFile]],
        file: Optional[UploadFile],
    ):
        user_id = self._validate_user_id(user_id)

        registered_path = self._embedding_path(user_id)
        if not os.path.isfile(registered_path):
            raise FaceServiceError.not_found("No registered face embedding found for this user")

        registered = self._load_npy(registered_path)
        registered = self._l2_normalize(registered)

        timings: dict[str, float] = {}
        with timed("loadFramesMs") as t:
            frame_arrays = await self._load_frames(frames=frames, file=file)
        timings.update(t)

        if self.enable_liveness:
            with timed("livenessMs") as t:
                live_result = run_liveness_checks(frame_arrays)
            timings.update(t)
            if not live_result.passed:
                out = {
                    "userId": user_id,
                    "match": False,
                    "matched": False,
                    "similarity": 0.0,
                    "livenessPassed": False,
                    "message": live_result.message,
                }
                if debug_enabled():
                    out["debug"] = {"timings": timings, "frames": len(frame_arrays)}
                return out

        # Take a bounded number of best-quality frames for embedding (avoids worst frames dominating latency).
        with timed("selectFramesMs") as t:
            scored = self._score_frames(frame_arrays)
        timings.update(t)
        selected = scored[: self.max_verify_frames]

        probe_embeddings: List[np.ndarray] = []
        multiple_faces = 0
        no_face = 0
        embed_errors = 0

        with timed("embedMs") as t_total:
            for item in selected:
                try:
                    emb = extract_single_arcface_embedding(item.img_bgr)
                    probe_embeddings.append(emb)
                except FaceServiceError as ex:
                    if ex.message.lower().startswith("multiple faces"):
                        multiple_faces += 1
                    elif ex.message.lower().startswith("no face"):
                        no_face += 1
                    else:
                        embed_errors += 1
                except Exception:
                    embed_errors += 1
        timings.update(t_total)

        if not probe_embeddings:
            if multiple_faces:
                raise FaceServiceError.bad_request("Multiple faces detected")
            if no_face:
                raise FaceServiceError.bad_request("No face detected")
            raise FaceServiceError.bad_request("Invalid image")

        with timed("compareMs") as t:
            best_sim, best_idx = self._best_similarity(probe_embeddings, registered)
        timings.update(t)

        threshold = self.similarity_threshold
        is_match = best_sim >= threshold

        out = {
            "userId": user_id,
            "match": bool(is_match),
            "matched": bool(is_match),  # backward-friendly alias
            "similarity": float(best_sim),
        }
        if self.enable_liveness:
            out["livenessPassed"] = True

        if debug_enabled():
            out["debug"] = {
                "timings": timings,
                "threshold": float(threshold),
                "framesReceived": len(frame_arrays),
                "framesSelected": len(selected),
                "bestFrameIndex": int(best_idx) if best_idx is not None else None,
                "skipped": {"multipleFaces": multiple_faces, "noFace": no_face, "errors": embed_errors},
                "registeredEmbeddingPath": os.path.relpath(registered_path, start=self.service_root),
            }

        return out

    async def test_face(self, user_id: str, file: UploadFile):
        # Debug endpoint kept for compatibility; behaves like verify but forces a single probe image.
        return await self.verify_face(user_id=user_id, frames=None, file=file)

    def _validate_quality_or_throw(self, frame: np.ndarray) -> None:
        blur_var = check_blur(frame)
        if blur_var < self.min_blur_var:
            raise FaceServiceError.bad_request("Blurry image")

        brightness = check_brightness(frame)
        if brightness < self.min_brightness:
            raise FaceServiceError.bad_request("Low light image")

    async def _load_frames(
        self,
        frames: Optional[List[UploadFile]],
        file: Optional[UploadFile],
    ) -> List[np.ndarray]:
        uploads: List[UploadFile] = []
        if frames:
            uploads.extend(frames)
        elif file is not None:
            uploads.append(file)
        else:
            raise FaceServiceError.bad_request("image file is required")

        arrays: List[np.ndarray] = []
        for up in uploads:
            raw = await up.read()
            if not raw:
                continue
            img = decode_image(raw)
            arrays.append(img)
            if debug_enabled():
                log.info("Verify recv filename=%s bytes=%s shape=%s", up.filename, len(raw), img.shape)

        if not arrays:
            raise FaceServiceError.bad_request("No valid images provided")

        return arrays

    def _score_frames(self, frames: List[np.ndarray]) -> List[_FrameScore]:
        scored: List[_FrameScore] = []
        for frame in frames:
            try:
                blur_var = check_blur(frame)
                brightness = check_brightness(frame)
                if blur_var < self.min_blur_var or brightness < self.min_brightness:
                    continue
                # Favor sharper + brighter frames; keep cheap scoring.
                score = (blur_var * 0.02) + (brightness * 0.01)
                scored.append(_FrameScore(score=score, img_bgr=frame))
            except Exception:
                continue
        scored.sort(key=lambda x: x.score, reverse=True)
        return scored if scored else [_FrameScore(score=0.0, img_bgr=f) for f in frames]

    def _validate_user_id(self, user_id: str) -> str:
        if not user_id:
            raise FaceServiceError.bad_request("userId is required")
        user_id = str(user_id).strip()
        if not _USER_ID_RE.match(user_id):
            raise FaceServiceError.bad_request("Invalid userId")
        return user_id

    def _embedding_path(self, user_id: str) -> str:
        return os.path.join(self.uploads_dir, f"{user_id}.npy")

    def _atomic_save_npy(self, path: str, arr: np.ndarray) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = f"{path}.tmp.{uuid4().hex}.npy"
        try:
            np.save(tmp, np.asarray(arr, dtype=np.float32))
            os.replace(tmp, path)
        finally:
            try:
                if os.path.isfile(tmp):
                    os.remove(tmp)
            except Exception:
                pass

    def _load_npy(self, path: str) -> np.ndarray:
        try:
            return np.load(path, allow_pickle=False).astype(np.float32, copy=False)
        except FileNotFoundError:
            raise FaceServiceError.not_found("No registered face embedding found for this user")
        except Exception as ex:
            raise FaceServiceError.internal("Failed to load registered embedding", details={"reason": str(ex)})

    def _best_similarity(self, probes: List[np.ndarray], registered: np.ndarray) -> Tuple[float, Optional[int]]:
        best = -1.0
        best_idx: Optional[int] = None
        reg = self._l2_normalize(registered)
        for i, emb in enumerate(probes):
            sim = cosine_similarity(self._l2_normalize(emb), reg)
            if sim > best:
                best = sim
                best_idx = i
        return float(best), best_idx

    def _l2_normalize(self, v: np.ndarray) -> np.ndarray:
        v = np.asarray(v, dtype=np.float32).reshape(-1)
        n = float(np.linalg.norm(v))
        if n <= 1e-8:
            return v
        return (v / n).astype(np.float32, copy=False)
