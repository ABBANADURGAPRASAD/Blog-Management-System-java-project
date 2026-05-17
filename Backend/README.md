# Blog Management System — Backend

Enterprise-style **Spring Boot 3** multi-module API for a social blog platform: posts, comments, likes, profiles, followers, direct messages, notifications, anonymous chat, encrypted secrets, optional **Kafka** delivery, and an integrated **AI content moderation** module (`ai-support/`).

**Base URL:** `http://localhost:8080`  
**Run guide:** [`../ExcutionInfofile.md`](../ExcutionInfofile.md)

---

## Table of contents

- [Technologies](#technologies)
- [Architecture](#architecture)
- [How it works](#how-it-works)
- [Why this design is efficient](#why-this-design-is-efficient)
- [Features](#features)
- [New & advanced features](#new--advanced-features)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [How to run](#how-to-run)
- [API overview](#api-overview)
- [AI moderation integration](#ai-moderation-integration)
- [Documentation index](#documentation-index)

---

## Technologies

| Layer | Technology | Version / notes |
|-------|------------|-----------------|
| Language | **Java** | 17 |
| Framework | **Spring Boot** | 3.1.1 |
| Web | **Spring Web** (Tomcat) | REST, multipart uploads |
| Persistence | **Spring Data JPA** + **Hibernate** | `ddl-auto=update` |
| Database | **MySQL** | 8.x, schema `blog_db` |
| Messaging | **Spring Kafka** | Chat delivery events (optional) |
| Real-time | **Spring WebSocket** | Anonymous chat |
| Email | **Spring Mail** | SMTP notifications |
| Security | **AES-256** encrypted properties | `APP_SECRET_KEY`, `SecretsConfig` |
| Build | **Maven** | Multi-module parent POM |
| Boilerplate | **Lombok** | Entities, DTOs |
| JSON | **Jackson** | API + Kafka payloads |
| AI (module) | **Python FastAPI** + Kafka | See [`ai-support/`](ai-support/) |
| AI audit DB | **PostgreSQL** (optional) | Moderation logs & scores |

---

## Architecture

Three Maven modules with **clear layering**:

```text
┌─────────────────────────────────────────────────────────┐
│  Blog_mng_app          Runnable JAR (BlogApplication)    │
│  • ComponentScan com.blog + com.bolg                    │
│  • Embeds Tomcat, loads application.properties          │
└───────────────────────────┬─────────────────────────────┘
                            │ depends on
┌───────────────────────────▼─────────────────────────────┐
│  Blog_mng_sevice       blog-service                      │
│  • @Service implementations                             │
│  • JPA Repositories                                     │
│  • Kafka producers/consumers (chat)                     │
│  • File storage                                         │
└───────────────────────────┬─────────────────────────────┘
                            │ depends on
┌───────────────────────────▼─────────────────────────────┐
│  Blog_mng_api          blog-api                          │
│  • @RestController                                      │
│  • JPA @Entity models                                   │
│  • Service interfaces, config, crypto, events           │
└─────────────────────────────────────────────────────────┘
```

**Request path:** `Controller` → `Service interface` → `ServiceImpl` → `Repository` → **MySQL**.

**Event path (chat):** `ChatServiceImpl` saves message → `ChatMessageDeliveredEvent` → `ChatKafkaDeliveryBridge` (after commit) → Kafka topic → `ChatKafkaDeliveryConsumer`.

---

## How it works

### 1. Application bootstrap

`BlogApplication` (`com.bolg`) scans `com.blog` for controllers, services, repositories, and Kafka config. JPA entities live in `blog-api`; repositories in `blog-service`.

### 2. Configuration & secrets

`Backend/application.properties` holds DB, mail, Kafka, and upload limits. Sensitive values can be stored **encrypted**; at startup `SecretsConfig` + `CryptoService` decrypt them using `APP_SECRET_KEY` (see [`SECURITY_ENCRYPTION_GUIDE.md`](SECURITY_ENCRYPTION_GUIDE.md)).

### 3. REST API

Controllers in `com.blog.controller` expose JSON under `/api/*`. File uploads use `multipart/form-data`; static files served from `/uploads/{filename}`.

### 4. Persistence

Hibernate maps entities (`User`, `Post`, `Comment`, `Like`, `ChatMessage`, followers, notifications, anonymous chat, …) to MySQL. Relationships use `@ManyToOne`, `@OneToMany`, and mention tables (`PostMention`, `CommentMention`).

### 5. Notifications

`NotificationService` creates in-app notifications for comments, likes, mentions, follows, and new posts—decoupled from controllers via service layer.

### 6. Kafka (optional)

When `app.kafka.publish-enabled=true`, chat messages trigger async delivery events without blocking HTTP threads (`@Async` + `chatKafkaTaskExecutor`). If Kafka is down, messages remain in MySQL; publish errors are logged.

---

## Why this design is efficient

| Pattern | Benefit |
|---------|---------|
| **Multi-module Maven** | API contracts stable; service layer testable; single deployable JAR |
| **Interface + Impl services** | Controllers depend on abstractions; easy to mock and extend |
| **Kafka after DB commit** | No lost messages if transaction rolls back; ordering preserved |
| **Async Kafka publish** | Servlet threads not blocked on broker latency |
| **Encrypted secrets** | Credentials not stored in plain text in repo |
| **JPA `ddl-auto=update`** | Fast local dev schema evolution |
| **Local file uploads** | Simple media path without S3 dependency in dev |
| **Separate ai-support module** | ML scale-out without bloating main JAR |

---

## Features

### Core blog

- User **register / login** with hashed passwords and token in response
- **CRUD posts** with title, content, category, tags
- **Multipart media** — images, video, PDF (`mediaUrl`, `mediaType`)
- **Comments** with `@mention` parsing and notifications
- **Likes** toggle per user/post
- **Popular posts** — ranked by likes + comments (SQL aggregation)

### Social

- **Follow / unfollow** users with counts and relationship checks
- **User profiles** — bio, social links, profile & background images
- **Mentions** on posts and comments

### Messaging

- **Direct messages (DM)** — send, inbox, thread, read receipts, unread badge
- **Kafka-backed delivery** pipeline for future push/WebSocket fan-out

### Anonymous & map features

- **Random / anonymous chat** — matchmaking, sessions, WebSocket messaging
- **Map presence** — optional location sharing for finder/match features

### Platform

- **Email** via SMTP (registration, alerts—configurable)
- **CORS** enabled for Angular dev proxy
- **File controller** — secure-ish local storage under `Backend/uploads/`

---

## New & advanced features

| Feature | Location | Description |
|---------|----------|-------------|
| **AI content moderation** | [`ai-support/`](ai-support/) | Kafka + Python pipelines for posts, comments, profiles, media |
| **Encrypted configuration** | `SecretsConfig`, `CryptoUtil` | Production-ready secret handling |
| **Post/comment mentions** | `MentionParser`, `*Mention` entities | `@user` style tagging + notifications |
| **Chat Kafka bridge** | `ChatKafkaDeliveryBridge` | Reliable post-commit event publishing |
| **Anonymous WebSocket chat** | `AnonymousWebSocketConfig` | Real-time anonymous sessions |
| **Gender / map preferences** | `User`, anonymous models | Matchmaking metadata |

---

## Project structure

```text
Backend/
├── pom.xml                    # Parent POM (modules)
├── application.properties     # Main config (DB, Kafka, mail, uploads)
├── database_schema.sql        # MySQL DDL
├── Blog_mng_app/              # Spring Boot entry (java/com/bolg/BlogApplication.java)
├── Blog_mng_api/              # Controllers, entities, config, crypto
│   └── java/com/blog/
│       ├── controller/        # Auth, Post, Comment, User, Chat, …
│       ├── model/             # JPA entities & DTOs
│       ├── config/            # CORS, secrets, datasource, WebSocket
│       └── service/           # Service interfaces
├── Blog_mng_sevice/           # Implementations + repositories + kafka
│   └── java/com/blog/
│       ├── service/impl/
│       ├── repository/
│       └── kafka/
├── ai-support/                # AI moderation platform (Python + docs + Java samples)
├── uploads/                   # Uploaded media files
├── docs/                      # Config & module explanation index
├── UI_HANDOFF.md              # Full REST API for frontend
└── SECURITY_ENCRYPTION_GUIDE.md
```

---

## Configuration

Key properties in `application.properties`:

| Property | Purpose |
|----------|---------|
| `spring.datasource.*` | MySQL connection |
| `spring.jpa.hibernate.ddl-auto` | Schema update mode |
| `server.port` | Default `8080` |
| `spring.mail.*` | SMTP |
| `spring.kafka.bootstrap-servers` | Kafka broker |
| `app.kafka.publish-enabled` | Chat Kafka on/off |
| `spring.servlet.multipart.max-file-size` | Upload limit (10MB) |
| `jwt.secret.encrypted` | Token signing (with `APP_SECRET_KEY`) |

---

## How to run

```bash
cd Backend
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
mvn clean install
cd Blog_mng_app
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=file:../application.properties"
```

**JAR:**

```bash
java -jar Blog_mng_app/target/blog-app-0.0.1-SNAPSHOT.jar \
  --spring.config.location=file:../application.properties
```

Full steps (MySQL, Docker, AI): [`../ExcutionInfofile.md`](../ExcutionInfofile.md).

---

## API overview

| Area | Base path |
|------|-----------|
| Auth | `/api/auth` |
| Posts | `/api/posts` |
| Comments | `/api/posts/{id}/comments` |
| Likes | `/api/posts/{id}/like` |
| Users | `/api/users` |
| Followers | `/api/followersAndFollowing` |
| Chat | `/api/chat` |
| Notifications | `/api/notifications` |
| Files | `/uploads/{filename}` |

**Complete reference:** [`UI_HANDOFF.md`](UI_HANDOFF.md)

---

## AI moderation integration

The `ai-support` module adds automated safety for UGC. Java samples live in:

[`ai-support/java-integration/README.md`](ai-support/java-integration/README.md)

High-level: content saved as `PENDING_MODERATION` → Kafka → Python AI → status updated to `APPROVED` / `WARNING` / `BLOCKED`.

---

## Documentation index

| Document | Contents |
|----------|----------|
| [`docs/README.md`](docs/README.md) | Docs index |
| [`Blog_mng_api/README.md`](Blog_mng_api/README.md) | API module file guide |
| [`Blog_mng_sevice/README.md`](Blog_mng_sevice/README.md) | Service module + Kafka |
| [`Blog_mng_app/README.md`](Blog_mng_app/README.md) | Boot entry module |
| [`UI_HANDOFF.md`](UI_HANDOFF.md) | REST contract for UI |
| [`ai-support/README.md`](ai-support/README.md) | AI platform |
| [`../ExcutionInfofile.md`](../ExcutionInfofile.md) | Step-by-step execution |

---

## Database

Primary store: **MySQL** `blog_db`. Core tables: `users`, `posts`, `comments`, `likes`, plus extensions for chat, follows, notifications, anonymous chat.

```bash
mysql -u root -p < database_schema.sql
```

Popular posts query example is in the original schema section above.

---

## License

See [`LICENSE`](LICENSE).
