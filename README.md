# Blog Management System

A full-stack **social blog platform** built with **Spring Boot 3** (Java) and **Angular 20**. Users can publish posts with rich media, comment, like, follow each other, exchange direct messages, use anonymous chat, and—via the optional **AI Safety module**—have content automatically moderated for policy violations.

---

## Table of contents

- [Overview](#overview)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Documentation map](#documentation-map)
- [Ports & URLs](#ports--urls)
- [Security](#security)
- [License](#license)

---

## Overview

This repository is a **multi-module Maven backend** + **Angular SPA frontend**, designed for learning and production-style extension:

| Layer | Path | Role |
|-------|------|------|
| **Backend API** | `Backend/` | REST, JPA, MySQL, Kafka, WebSocket, email |
| **AI moderation** | `Backend/ai-support/` | Python FastAPI + Kafka + PostgreSQL audit |
| **Frontend** | `frontend/` | Angular UI, proxy to API |
| **Runbook** | [`ExcutionInfofile.md`](ExcutionInfofile.md) | **Complete step-by-step execution guide** |

---

## Key features

### Blogging & content

- Create, read, update posts with **categories**, **tags**, and **@mentions**
- Upload **images, video, and PDF** (multipart)
- **Comments** and **likes** on posts
- **Popular posts** ranked by engagement

### Social & identity

- **Registration & login** with secure password storage
- **User profiles** — bio, social links, profile & background images
- **Follow / unfollow** with follower lists and counts
- **In-app notifications** for social activity

### Messaging & real-time

- **Direct messages (DM)** — inbox, threads, read receipts, unread badges
- **Kafka-backed** message delivery pipeline (optional, for scale-out notifications)
- **Anonymous / random chat** with WebSocket support
- **Map-based presence** (finder / matchmaking metadata)

### AI content moderation (module)

- Enterprise **AI Safety platform** under `Backend/ai-support/`
- Automatic analysis of posts, comments, profiles, bios, and media
- Detects NSFW, hate speech, toxicity, spam, threats, violence, impersonation, and more
- **Multilingual** support (English, Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, Arabic, …)
- Async **Kafka** workflow: Java orchestrates → Python infers → status `APPROVED` / `WARNING` / `BLOCKED`
- Human review queue and full audit trail (PostgreSQL)

Details: [`Backend/ai-support/README.md`](Backend/ai-support/README.md) · Java bridge: [`Backend/ai-support/java-integration/README.md`](Backend/ai-support/java-integration/README.md)

### Platform & security

- **AES-encrypted** secrets in configuration (`APP_SECRET_KEY`)
- **CORS** and dev **proxy** for seamless Angular ↔ Spring communication
- Local **file storage** with `/uploads` serving

---

## Technology stack

### Backend

| Technology | Purpose |
|------------|---------|
| Java 17 | Language |
| Spring Boot 3.1.1 | Framework |
| Spring Data JPA / Hibernate | ORM |
| MySQL 8 | Primary database |
| Spring Kafka | Chat & moderation events |
| Spring WebSocket | Anonymous chat |
| Spring Mail | Email notifications |
| Maven | Multi-module build |
| Lombok | Boilerplate reduction |

### AI module (`ai-support`)

| Technology | Purpose |
|------------|---------|
| Python 3.11 + FastAPI | AI inference API |
| Apache Kafka | Async moderation pipeline |
| PostgreSQL | Moderation audit & scores |
| Redis | Inference cache |
| FFmpeg / ONNX / Transformers | Video & ML (production) |
| Docker / Kubernetes | Deployment |

### Frontend

| Technology | Purpose |
|------------|---------|
| Angular 20 | SPA framework |
| TypeScript 5.8 | Language |
| RxJS | Async streams |
| HttpClient + interceptors | API & auth |
| Leaflet | Map UI |
| proxy.conf.json | Dev API proxy |

---

## System architecture

```text
                    ┌─────────────────┐
                    │  Angular UI     │
                    │  :4400          │
                    └────────┬────────┘
                             │ HTTP /api, /uploads, /ws
                    ┌────────▼────────┐
                    │  Spring Boot    │
                    │  Blog_mng_*     │
                    │  :8080          │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
       │   MySQL     │ │   Kafka   │ │ ai-support│
       │   blog_db   │ │  events   │ │ Python AI │
       └─────────────┘ └───────────┘ └─────┬─────┘
                                           │
                                    ┌──────▼──────┐
                                    │ PostgreSQL  │
                                    │ moderation  │
                                    └─────────────┘
```

**Backend layering:** `Blog_mng_app` (boot) → `Blog_mng_sevice` (business + repos + Kafka) → `Blog_mng_api` (controllers + entities).

**Why it scales:** API stays fast; Kafka offloads chat delivery and AI work; Python workers scale horizontally; moderation data isolated in PostgreSQL.

---

## Project structure

```text
Blog-Management-System-java-project/
├── README.md                          # This file — project overview
├── ExcutionInfofile.md                # Full run steps (DB, Docker, Java, AI, Angular)
├── LICENSE
│
├── Backend/
│   ├── pom.xml                        # Parent Maven POM
│   ├── application.properties         # DB, Kafka, mail, secrets
│   ├── database_schema.sql
│   ├── Blog_mng_app/                  # Spring Boot entry
│   ├── Blog_mng_api/                  # Controllers, models, config
│   ├── Blog_mng_sevice/               # Services, repositories, Kafka
│   ├── ai-support/                    # AI moderation platform
│   │   ├── python-ai-service/         # FastAPI + workers
│   │   ├── java-integration/        # Spring integration samples
│   │   ├── database/                  # PostgreSQL schema
│   │   ├── docker/                    # Compose stack
│   │   └── docs/                      # Architecture & guides
│   ├── uploads/                       # Media files
│   ├── UI_HANDOFF.md                  # REST API reference
│   └── README.md                      # Backend deep-dive
│
└── frontend/
    ├── src/app/                       # Components, services, routes
    ├── proxy.conf.json
    ├── package.json
    └── README.md                      # Frontend deep-dive
```

---

## Quick start

> **For every command and troubleshooting step, use [`ExcutionInfofile.md`](ExcutionInfofile.md).**

### 1. Database (MySQL)

```bash
mysql -u root -p < Backend/database_schema.sql
```

Update `Backend/application.properties` with your MySQL username/password.

### 2. Backend (Java)

```bash
cd Backend
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
mvn clean install
cd Blog_mng_app
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=file:../application.properties"
```

API: **http://localhost:8080**

### 3. Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

UI: **http://localhost:4400**

### 4. AI moderation (optional)

```bash
cd Backend/ai-support/docker
cp .env.example .env
docker compose up -d
```

AI API: **http://localhost:8090** — see [`Backend/ai-support/README.md`](Backend/ai-support/README.md).

---

## Documentation map

| Document | What you’ll find |
|----------|------------------|
| **[ExcutionInfofile.md](ExcutionInfofile.md)** | Complete execution: MySQL, Docker, Java, AI, Angular, ports, troubleshooting |
| **[Backend/README.md](Backend/README.md)** | Backend technologies, architecture, how/why it works, features |
| **[Backend/UI_HANDOFF.md](Backend/UI_HANDOFF.md)** | Full REST API for UI developers |
| **[Backend/ai-support/README.md](Backend/ai-support/README.md)** | AI moderation platform overview |
| **[Backend/ai-support/java-integration/README.md](Backend/ai-support/java-integration/README.md)** | **AI-only** tech & Java↔Python integration |
| **[Backend/ai-support/docs/ARCHITECTURE.md](Backend/ai-support/docs/ARCHITECTURE.md)** | Enterprise AI architecture |
| **[frontend/README.md](frontend/README.md)** | Frontend technologies, routes, services, UX |
| [Backend/docs/README.md](Backend/docs/README.md) | Backend docs index |
| [Backend/SECURITY_ENCRYPTION_GUIDE.md](Backend/SECURITY_ENCRYPTION_GUIDE.md) | Encrypted secrets setup |

### Module-level guides

- [Blog_mng_api/README.md](Backend/Blog_mng_api/README.md)
- [Blog_mng_sevice/README.md](Backend/Blog_mng_sevice/README.md)
- [Blog_mng_app/README.md](Backend/Blog_mng_app/README.md)

---

## Ports & URLs

| Service | URL |
|---------|-----|
| Angular dev server | http://localhost:4400 |
| Spring Boot API | http://localhost:8080 |
| AI moderation API | http://localhost:8090 |
| MySQL | localhost:3306 |
| Kafka (optional) | localhost:9092 |
| PostgreSQL moderation (Docker) | localhost:5433 |

---

## API summary

**Base URL:** `http://localhost:8080`

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Posts | `GET/POST /api/posts`, `GET /api/posts/popular` |
| Comments | `GET/POST /api/posts/{id}/comments` |
| Likes | `POST /api/posts/{id}/like` |
| Users | `GET/PUT /api/users/{id}`, image uploads |
| Follow | `/api/followersAndFollowing/*` |
| Chat | `/api/chat/*` |
| Files | `GET /uploads/{filename}` |

Full contract: **[Backend/UI_HANDOFF.md](Backend/UI_HANDOFF.md)**

---

## Security

- Passwords stored as **hashes** (never plain text in API responses)
- **Encrypted** DB/mail/JWT properties with `APP_SECRET_KEY`
- Route **guards** on frontend; validate `userId` on backend for actions
- **CORS** open in dev — restrict origins in production
- Enable **AI moderation** and file validation before public deployment
- Do not commit `secrets.enc` or production credentials

---

## Prerequisites

- JDK 17+, Maven 3.6+
- Node.js 18+, npm 8+
- MySQL 8.0+
- Optional: Docker, Python 3.11 (AI module), Kafka

---

## Contributing

1. Fork the repository  
2. Create a feature branch  
3. Test backend (`mvn test`) and frontend (`npm test` if configured)  
4. Submit a pull request  

---

## License

See [LICENSE](Backend/LICENSE).

---

**Happy building — and see [ExcutionInfofile.md](ExcutionInfofile.md) to run the full stack end to end.**
