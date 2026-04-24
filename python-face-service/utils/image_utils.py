from __future__ import annotations

import os
from typing import List, Tuple

import cv2
import numpy as np

from utils.errors import FaceServiceError

FaceBox = Tuple[int, int, int, int]  # x, y, w, h


_FACE_CASCADE = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"))
_PROFILE_CASCADE = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_profileface.xml"))


def decode_image(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise FaceServiceError.bad_request("Unsupported image format")
    return img


def detect_faces(img_bgr: np.ndarray) -> List[FaceBox]:
    if img_bgr is None or img_bgr.size == 0:
        return []
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = _FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(60, 60))
    out = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
    if out:
        return _filter_faces_by_area(img_bgr, out)

    # Fallback to profile faces (for head turn frames).
    prof = _PROFILE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    out2 = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in prof]
    return _filter_faces_by_area(img_bgr, out2)


def ensure_single_face(faces: List[FaceBox]) -> None:
    if not faces:
        raise FaceServiceError.bad_request("No face detected")
    if len(faces) > 1:
        raise FaceServiceError.bad_request("Multiple faces detected")


def detect_multiple_faces(img_bgr: np.ndarray) -> bool:
    return len(detect_faces(img_bgr)) > 1


def check_blur(img_bgr: np.ndarray) -> float:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def check_brightness(img_bgr: np.ndarray) -> float:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray))


def crop_face(img_bgr: np.ndarray, face: FaceBox, margin: float = 0.30) -> np.ndarray:
    (x, y, w, h) = face
    ih, iw = img_bgr.shape[:2]
    mx = int(w * margin)
    my = int(h * margin)
    x0 = max(0, x - mx)
    y0 = max(0, y - my)
    x1 = min(iw, x + w + mx)
    y1 = min(ih, y + h + my)
    cropped = img_bgr[y0:y1, x0:x1].copy()
    if cropped.size == 0:
        raise FaceServiceError.bad_request("Could not crop face")
    return cropped


def resize_face(img_bgr: np.ndarray, size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    return cv2.resize(img_bgr, size, interpolation=cv2.INTER_AREA)


def preprocess_and_crop_face(img_bgr: np.ndarray, face: FaceBox) -> np.ndarray:
    cropped = crop_face(img_bgr, face)
    resized = resize_face(cropped, (224, 224))
    return resized


def _filter_faces_by_area(img_bgr: np.ndarray, faces: List[FaceBox], min_area_ratio: float = 0.02) -> List[FaceBox]:
    if not faces:
        return []
    ih, iw = img_bgr.shape[:2]
    frame_area = float(ih * iw)
    filtered = []
    for (x, y, w, h) in faces:
        if w <= 0 or h <= 0:
            continue
        if (float(w * h) / frame_area) >= min_area_ratio:
            filtered.append((x, y, w, h))
    # Prefer larger faces first for stability.
    filtered.sort(key=lambda b: b[2] * b[3], reverse=True)
    return filtered


def save_face_image(student_dir: str, index: int, face_bgr: np.ndarray) -> str:
    os.makedirs(student_dir, exist_ok=True)
    out = os.path.join(student_dir, f"image{index}.jpg")
    ok = cv2.imwrite(out, face_bgr)
    if not ok:
        raise FaceServiceError.internal("Failed to save image")
    return out
