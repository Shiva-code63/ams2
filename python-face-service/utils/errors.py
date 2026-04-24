from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class FaceServiceError(Exception):
    status_code: int
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

    @staticmethod
    def bad_request(message: str, *, details: Optional[Dict[str, Any]] = None) -> "FaceServiceError":
        return FaceServiceError(status_code=400, error="bad_request", message=message, details=details)

    @staticmethod
    def not_found(message: str, *, details: Optional[Dict[str, Any]] = None) -> "FaceServiceError":
        return FaceServiceError(status_code=404, error="not_found", message=message, details=details)

    @staticmethod
    def internal(message: str, *, details: Optional[Dict[str, Any]] = None) -> "FaceServiceError":
        return FaceServiceError(status_code=500, error="internal_error", message=message, details=details)

