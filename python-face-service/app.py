from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from routes.face_routes import router as face_router
from utils.errors import FaceServiceError

log = logging.getLogger("app")


def _configure_logging() -> None:
    log_dir = os.getenv("FACE_SERVICE_LOG_DIR", os.path.join(os.path.dirname(__file__), "logs"))
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )

    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "face-service.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)


_configure_logging()

app = FastAPI(title="Face Recognition Service", version="1.0.0")

@app.on_event("startup")
def warmup_models():
    # First DeepFace call can be slow (model build + weight download). Warm up on startup.
    if os.getenv("FACE_SERVICE_WARMUP", "true").lower() in {"0", "false", "no"}:
        return
    try:
        from utils.deepface_utils import warmup_deepface

        warmup_deepface()
        log.info("DeepFace ArcFace/RetinaFace warmed up")
    except Exception as ex:
        # Not fatal; the first request will attempt to build the model again.
        log.warning("DeepFace warmup failed: %s", str(ex))


@app.exception_handler(FaceServiceError)
async def face_service_error_handler(_: Request, exc: FaceServiceError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error, "message": exc.message, "details": exc.details},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


app.include_router(face_router)
