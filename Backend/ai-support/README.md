# AI Content Moderation & Safety Platform

Enterprise-grade AI moderation module for the Blog Management System. Lives entirely under `Backend/ai-support` and integrates with the main Spring Boot app via **Kafka events** and optional **REST callbacks**.

## Quick navigation

| Document | Purpose |
|----------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system design, workflows, queue strategy, K8s, security |
| [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) | Wire moderation into Post/Comment/User APIs |
| [docs/MODELS-AND-THRESHOLDS.md](docs/MODELS-AND-THRESHOLDS.md) | Open-source model picks, scores, multilingual pipeline |
| [docs/MONITORING-SECURITY.md](docs/MONITORING-SECURITY.md) | Observability, mTLS, rate limits, audit |
| [docs/HUMAN-REVIEW.md](docs/HUMAN-REVIEW.md) | Moderator queue, appeals, SLA |
| [docs/IMPLEMENTATION-PHASES.md](docs/IMPLEMENTATION-PHASES.md) | Phased rollout checklist |

## Components

```
ai-support/
├── docs/                    # Architecture & runbooks
├── database/                # PostgreSQL schema (recommended for moderation store)
├── contracts/               # OpenAPI + JSON Schema events
├── java-integration/        # Copy-paste Spring samples for Blog_mng_*
├── python-ai-service/       # FastAPI AI engine + Kafka consumer
├── docker/                  # docker-compose (Kafka, Redis, AI, observability stubs)
└── k8s/                     # Kubernetes manifests
```

## High-level flow

1. User creates/updates post, comment, or profile → main API persists entity as **`PENDING_MODERATION`**.
2. Java publishes `ModerationRequestedEvent` to Kafka topic `moderation.requested`.
3. Python AI workers consume, run text/image/video pipelines, publish `moderation.completed`.
4. Java consumer updates status: **`APPROVED`**, **`WARNING`**, or **`BLOCKED`**; triggers notifications and audit logs.
5. High-risk or borderline scores route to **human review** queue.

## Local development

```bash
# From Backend/ai-support/docker
cp .env.example .env
docker compose up -d   # Kafka, Redis, PostgreSQL (moderation DB), Python AI

# Python service (without Docker)
cd ../python-ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8090
```

Enable in main `application.properties`:

```properties
app.moderation.enabled=true
app.kafka.moderation.request-topic=moderation.requested
app.kafka.moderation.completed-topic=moderation.completed
spring.kafka.listener.auto-startup=true
```

See [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) for entity column migrations on `posts`, `comments`, and `users`.

## Why Kafka (not only REST)

Your project **already uses Kafka** for chat delivery (`ChatKafkaDeliveryBridge`). Reusing Kafka for moderation gives:

- Decoupled scaling of AI workers independent of servlet threads
- Natural backpressure, retries, and dead-letter topics
- Replay for model upgrades and audit reconstruction

REST/gRPC to Python remains available for **synchronous** paths (e.g. username check at registration) via `python-ai-service` `/api/v1/moderate/sync`.

## Status

This folder is the **source of truth** for the moderation platform. Implement Java hooks in `Blog_mng_sevice` using `java-integration/samples` as templates.
