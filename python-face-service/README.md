# Python Face Service (ArcFace + RetinaFace)

FastAPI microservice for face registration and verification:

- **Detection**: RetinaFace (DeepFace `detector_backend="retinaface"`)
- **Alignment**: automatic (DeepFace `align=True`)
- **Embedding**: ArcFace (DeepFace `model_name="ArcFace"`)
- **Comparison**: cosine similarity

## Endpoints

### `POST /register-face`

Form fields:

- `userId` (string)
- `image` (file)

Stores the registered embedding at `uploads/faces/{userId}.npy`.

Notes:
- For backward compatibility the service also accepts `studentId` and/or `files` (multi-image registration); if multiple images are provided, embeddings are averaged and L2-normalized before saving.

### `POST /verify-face`

Form fields:

- `userId` (string)
- `image` (file)

Response (always includes these keys):

```json
{"match": true, "similarity": 0.82}
```

Notes:
- Backward compatible aliases: `studentId`, `file`, `frames`.

## Run

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Model weights (offline / restricted networks)

DeepFace downloads ArcFace / RetinaFace weights on first use. In restricted environments (no outbound HTTPS),
download the weights on a machine with internet access and copy them to the DeepFace weights directory
(commonly `C:\\Users\\<you>\\.deepface\\weights\\` on Windows).

## Tuning

See `.env.example` for environment variables (similarity threshold, liveness toggle, etc.).
