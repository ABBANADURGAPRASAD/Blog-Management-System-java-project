# AI Integration — Java ↔ Python Moderation Bridge

This folder contains **Spring Boot integration samples** that connect the main blog backend to the **AI Content Moderation & Safety** platform in [`../`](../) (`Backend/ai-support`).

> **Scope of this README:** AI-related technologies and features only. For the full AI architecture, see [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

---

## What this module does

When integrated, every sensitive user action is **automatically moderated** before or shortly after it becomes visible:

| Trigger | Content type | Analyzed |
|---------|--------------|----------|
| Post create/update | `POST` | Title, body, tags, hashtags, mentions, images, video |
| Comment create/update | `COMMENT` | Text, mentions, toxicity/hate/spam |
| Profile create/update | `USER_PROFILE` | Username, display name, bio |
| Bio update | `USER_BIO` | Bio text |
| Profile image | `USER_AVATAR` | Image URL / upload |
| Media upload | `USER_MEDIA` | Images, video |
| Future | `REEL`, `CHAT_MESSAGE`, `STORY` | Extensible via enum |

**Outcomes:** `APPROVED` · `WARNING` · `BLOCKED` (comments also map to `SAFE` / `WARNING` / `BLOCKED`).

---

## AI technologies used

### Orchestration (Java — this integration)

| Technology | Role in AI flow |
|------------|----------------|
| **Spring Kafka** | Publishes `moderation.requested`, consumes `moderation.completed` |
| **Spring WebClient** | Sync calls to Python for username/bio checks at registration |
| **Jackson** | JSON event contracts aligned with `contracts/moderation-event.schema.json` |
| **JPA + PostgreSQL** (moderation DB) | `moderation_requests`, `moderation_results`, audit logs |
| **MySQL columns** | `moderation_status`, `moderation_request_id` on posts/comments/users |

### Inference engine (Python — `../python-ai-service`)

| Technology | Role |
|------------|--------|
| **FastAPI** | REST API: `/api/v1/moderate/sync`, `/analyze`, health, metrics |
| **Pydantic** | Request/response validation, Kafka event parsing |
| **aiokafka** | Async consumer worker for `moderation.requested` |
| **ONNX Runtime** (prod) | Fast CPU/GPU image NSFW & violence inference |
| **Hugging Face Transformers** (prod) | Toxicity, hate speech, spam, threats |
| **fastText** (prod) | Language detection (en, hi, te, ta, ml, kn, bn, ar, …) |
| **NLLB / IndicTrans2** (prod) | Optional translate-then-moderate for unsupported langs |
| **FFmpeg + OpenCV** (prod) | Video frame extraction for NSFW/violence scans |
| **Redis** | Cache duplicate text/image hashes to skip re-inference |

### Infrastructure (AI stack)

| Technology | Why |
|------------|-----|
| **Apache Kafka** | Decouples API from GPU workers; replay after model upgrades; same broker as chat |
| **PostgreSQL** | JSONB scores, audit trail, human-review queue |
| **Docker / Kubernetes** | Scale AI workers independently of Spring Boot |
| **Prometheus** | `inference_latency_seconds`, queue lag, throughput |
| **JWT (internal)** | Secures Java → Python sync API |

### Planned / recommended open-source models

Documented in [`../docs/MODELS-AND-THRESHOLDS.md`](../docs/MODELS-AND-THRESHOLDS.md):

- Text: `unitary/toxic-bert`, `facebook/roberta-hate-speech-dynabench-r4-target`, `Hate-speech-CNERG/dehatebert-mono-indic`
- Image: `Falconsai/nsfw_image_detection`, violence ONNX checkpoints
- Video: Frame batching + same image models on sampled frames

Local dev ships **heuristic stubs** so the stack runs without downloading multi-GB models.

---

## How the AI flow works

```text
User action (post/comment/profile)
        │
        ▼
PostServiceImpl / CommentServiceImpl  ──►  moderation_status = PENDING_MODERATION
        │
        ▼
ModerationOrchestrator  ──►  ModerationKafkaProducer  ──►  topic: moderation.requested
        │
        ▼
Python kafka_consumer  ──►  text / image / video pipelines  ──►  decision_engine
        │
        ▼
topic: moderation.completed
        │
        ▼
ModerationResultConsumer  ──►  update entity status + NotificationService + audit PG
```

**Sync path (registration):** `ModerationSyncClient` → `POST http://localhost:8090/api/v1/moderate/sync` for instant username/bio screening.

---

## Why this design is efficient

1. **Non-blocking API** — HTTP returns quickly; heavy ML runs on separate Python workers.
2. **Horizontal scale** — Add Kafka consumer replicas without touching Spring Boot pods.
3. **Idempotency** — `idempotency_key` prevents duplicate moderation on retries.
4. **Redis dedup** — Identical text/images skip second inference.
5. **Kafka replay** — Re-moderate content after model upgrades without user resubmission.
6. **Separation of concerns** — Java owns transactions; Python owns ML; PostgreSQL owns audit.

---

## Sample files in `samples/`

| File | Purpose |
|------|---------|
| `ModerationStatus.java` | `PENDING_MODERATION`, `APPROVED`, `WARNING`, `BLOCKED` |
| `ModerationContentType.java` | POST, COMMENT, USER_PROFILE, … |
| `ModerationRequestedEvent.java` | Outbound Kafka payload |
| `ModerationCompletedEvent.java` | Inbound Kafka result |
| `ModerationOrchestrator.java` | Submit post/comment/profile for moderation |
| `ModerationKafkaProducer.java` | Async publish (mirrors `ChatKafkaDeliveryBridge`) |
| `ModerationResultConsumer.java` | Apply AI result to MySQL entities |
| `ModerationSyncClient.java` | WebClient sync for registration |
| `PostModerationHook.java` | Example hook in `PostServiceImpl` |
| `application-moderation.properties.snippet` | Feature flags & topic names |

---

## Integration steps

1. Copy samples into `Blog_mng_sevice` → packages `com.blog.moderation` and `com.blog.moderation.kafka`.
2. Add dependencies: `spring-kafka`, `spring-boot-starter-webflux` (WebClient).
3. Merge `application-moderation.properties.snippet` into `Backend/application.properties`.
4. Run `../database/mysql_app_migrations.sql` and `../database/schema.postgresql.sql`.
5. Start AI stack: [`../docker/docker-compose.yml`](../docker/docker-compose.yml).
6. Wire service hooks per [`../docs/INTEGRATION-GUIDE.md`](../docs/INTEGRATION-GUIDE.md).
7. Enable:
   ```properties
   app.moderation.enabled=true
   app.moderation.publish-enabled=true
   spring.kafka.listener.auto-startup=true
   ```

---

## Policy categories detected

NSFW · nudity · sexual content · violence/gore · hate speech · religious/country abuse · racism · toxicity · threats · spam/scam · fraud · bullying · harassment · illegal content · impersonation · abusive usernames · unsafe bios.

Thresholds and per-label scores: [`../docs/MODELS-AND-THRESHOLDS.md`](../docs/MODELS-AND-THRESHOLDS.md).

---

## Related documentation

| Document | Description |
|----------|-------------|
| [`../README.md`](../README.md) | AI platform overview |
| [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) | Enterprise architecture |
| [`../docs/INTEGRATION-GUIDE.md`](../docs/INTEGRATION-GUIDE.md) | Entity & service wiring |
| [`../docs/HUMAN-REVIEW.md`](../docs/HUMAN-REVIEW.md) | Moderator queue & appeals |
| [`../../ExcutionInfofile.md`](../../ExcutionInfofile.md) | Full project run commands |
