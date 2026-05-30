# AI Content Moderation & Safety Platform

Enterprise-grade AI moderation for the Blog Management System. Integrates with Spring Boot for **comments, direct chat, random/anonymous chat, and post media** (image/video).

## Quick navigation

| Document | Purpose |
|----------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, Kafka workflow |
| [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) | Wire moderation into entities |
| [docs/MODELS-AND-THRESHOLDS.md](docs/MODELS-AND-THRESHOLDS.md) | ONNX / transformers production models |
| [docs/MONITORING-SECURITY.md](docs/MONITORING-SECURITY.md) | Observability, rate limits, audit |

## Integrated endpoints (Python FastAPI)

| Method | Path | Used for |
|--------|------|----------|
| `POST` | `/api/v1/moderate/sync` | Comments, DM chat, anonymous chat (text) |
| `POST` | `/api/v1/moderate/media` | Post create — multipart image/video/PDF |
| `POST` | `/api/v1/moderate/analyze` | Full Kafka-style payload |
| `GET` | `/api/v1/health` | Health probe |

**Content types:** `POST`, `COMMENT`, `CHAT`, `ANONYMOUS_CHAT`, `USER_PROFILE`, …

## Media pipeline (posts)

1. **CNN** (`app/ml/cnn_nsfw.py`) — NSFW probability on images; per-frame on video (FFmpeg).
2. **OCR + RNN** (`app/ml/ocr_rnn.py`) — text extracted from frames, scored with text + character RNN boost.
3. **Decision engine** — aggregates labels → `APPROVED` / `WARNING` / `BLOCKED`.

Optional production upgrades:

- Set `NSFW_ONNX_MODEL_PATH` to an ONNX NSFW model.
- Install `tesseract` + `pytesseract` for real OCR.
- Install `ffmpeg` for video frame extraction.

## Local development

```bash
cd python-ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8090
```

Dev auth: `Authorization: Bearer dev-moderation-token` when `DEV_AUTH_BYPASS=true`.

Java config (`Backend/application.properties`):

```properties
app.moderation.use-ai-service=true
app.moderation.ai-service-url=http://localhost:8090
app.moderation.ai-service-token=dev-moderation-token
```

Full run order: project root [`ExcutionInfofile.md`](../../ExcutionInfofile.md).

## Components

```
ai-support/
├── python-ai-service/     # FastAPI + CNN/OCR pipelines
├── java-integration/      # Kafka samples (optional async path)
├── database/              # PostgreSQL audit + MySQL migrations
├── docker/                # Compose stack
└── docs/
```

## Status

**Wired in Java:** `ContentModerationFacade`, `AiModerationClient`, post validation before upload, chat/comment/anonymous paths.

**Async Kafka** path remains optional; see `java-integration/samples` for event-driven rollout.
