from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List

import cv2

from utils.image_utils import detect_faces, ensure_single_face


@dataclass(frozen=True)
class LivenessResult:
    passed: bool
    message: str


_EYE_CASCADE = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_eye.xml"))
_EYEGLASS_CASCADE = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_eye_tree_eyeglasses.xml"))


def run_liveness_checks(frames_bgr: List[np.ndarray]) -> LivenessResult:
    if not frames_bgr:
        return LivenessResult(False, "No frames provided")

    # We need a short sequence to detect blink + head turns.
    if len(frames_bgr) < 6:
        return LivenessResult(False, "Liveness failed: provide more frames")

    # MediaPipe Solutions is not available in newer MediaPipe wheels on some platforms (e.g. tasks-only builds).
    # To keep the service runnable, fall back to OpenCV-based liveness checks when landmarks are unavailable.
    return _run_opencv_liveness(frames_bgr)


def detect_blink(eye_counts: List[int]) -> bool:
    # Blink heuristic: eyes detected in some frames, and not detected in at least one frame.
    if len(eye_counts) < 4:
        return False
    any_open = any(c >= 1 for c in eye_counts)
    any_closed = any(c == 0 for c in eye_counts)
    # Also accept a significant drop (e.g., 2 -> 1 -> 0 can be flaky across cascades).
    max_c = max(eye_counts)
    min_c = min(eye_counts)
    significant_drop = max_c >= 1 and (max_c - min_c) >= 1
    return any_open and (any_closed or significant_drop)


def detect_head_turn(center_x_norm: List[float]) -> bool:
    # Head-turn heuristic: face center moves enough across frames and crosses "center".
    if len(center_x_norm) < 4:
        return False

    xmin = min(center_x_norm)
    xmax = max(center_x_norm)
    spread = xmax - xmin

    # Require noticeable motion (user turns head), but keep it tolerant.
    if spread < 0.14:
        return False

    center = any(0.45 <= x <= 0.55 for x in center_x_norm)
    moved_left = xmin < 0.44
    moved_right = xmax > 0.56
    return center and moved_left and moved_right


def _run_opencv_liveness(frames_bgr: List[np.ndarray]) -> LivenessResult:
    eye_counts: List[int] = []
    face_center_x_norm: List[float] = []

    for frame in frames_bgr:
        faces = detect_faces(frame)
        try:
            ensure_single_face(faces)
        except Exception:
            return LivenessResult(False, "Liveness failed: multiple/no face detected")

        (x, y, w, h) = faces[0]
        ih, iw = frame.shape[0], frame.shape[1]

        # Reject partially visible faces close to borders.
        margin = int(min(iw, ih) * 0.03)
        if x <= margin or y <= margin or (x + w) >= (iw - margin) or (y + h) >= (ih - margin):
            return LivenessResult(False, "Liveness failed: partially visible face")

        cx = (x + (w / 2.0)) / float(iw)
        face_center_x_norm.append(float(cx))

        face_roi = frame[max(0, y) : min(ih, y + h), max(0, x) : min(iw, x + w)]
        gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        eyes1 = _EYE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(18, 18))
        eyes2 = _EYEGLASS_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(18, 18))
        eye_counts.append(int(max(len(eyes1), len(eyes2))))

    if not detect_blink(eye_counts):
        return LivenessResult(False, "Liveness failed: blink not detected")

    if not detect_head_turn(face_center_x_norm):
        return LivenessResult(False, "Liveness failed: head turn left/right not detected")

    return LivenessResult(True, "Liveness passed")
