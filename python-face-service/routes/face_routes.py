from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, File, Form, UploadFile

from services.face_service import FaceService
from utils.errors import FaceServiceError

router = APIRouter()
face_service = FaceService()


@router.post("/register-face")
async def register_face(
    userId: Optional[str] = Form(default=None),
    studentId: Optional[str] = Form(default=None),  # backward compatible alias
    image: Optional[UploadFile] = File(default=None),
    file: Optional[UploadFile] = File(default=None),  # backward compatible alias
    files: Optional[List[UploadFile]] = File(default=None),  # backward compatible (multi-image registration)
):
    uid = (userId or studentId or "").strip()
    uploads: List[UploadFile] = []
    if image is not None:
        uploads.append(image)
    elif file is not None:
        uploads.append(file)
    elif files:
        uploads.extend(files)
    else:
        raise FaceServiceError.bad_request("image file is required")

    return await face_service.register_face(user_id=uid, files=uploads)


@router.post("/verify-face")
async def verify_face(
    userId: Optional[str] = Form(default=None),
    studentId: Optional[str] = Form(default=None),  # backward compatible alias
    frames: Optional[List[UploadFile]] = File(default=None),
    image: Optional[UploadFile] = File(default=None),
    file: Optional[UploadFile] = File(default=None),  # backward compatible alias
):
    uid = (userId or studentId or "").strip()
    single = image or file
    return await face_service.verify_face(user_id=uid, frames=frames, file=single)


@router.post("/test-face")
async def test_face(
    userId: Optional[str] = Form(default=None),
    studentId: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
):
    uid = (userId or studentId or "").strip()
    return await face_service.test_face(user_id=uid, file=file)
