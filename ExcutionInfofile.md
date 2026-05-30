# Blog Management System — Full Execution Guide

Step-by-step instructions to run **every part** of this project on your machine.

**Project root (use this path in all commands):**

```text
/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project
```

> Paths below use `PROJECT_ROOT` — replace with the path above, or `cd` there first.

**Optional — set once per terminal session (copy-paste):**

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
```

> **All execution and Docker commands live in this file** — use the table of contents below; no separate start guides required.

---


## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Recommended startup order](#2-recommended-startup-order)
3. [Database — MySQL (main app)](#3-database--mysql-main-app)
4. [Database — PostgreSQL (AI moderation, optional)](#4-database--postgresql-ai-moderation-optional)
5. [Docker — AI moderation stack (optional)](#5-docker--ai-moderation-stack-optional)
6. [Docker — Kafka only (optional, for chat)](#6-docker--kafka-only-optional-for-chat)
7. [Java Spring Boot backend](#7-java-spring-boot-backend)
8. [AI Support module](#8-ai-support-module-monitoring--security) — paths A/B/C, local Python, verify
9. [Angular frontend UI](#9-angular-frontend-ui)
10. [Verify everything works](#10-verify-everything-works)
11. [Ports reference](#11-ports-reference)
12. [Troubleshooting](#12-troubleshooting)
13. [All local commands (copy-paste)](#13-all-local-commands-copy-paste)
14. [Docker images — build, tag, and run](#14-docker-images--build-tag-and-run)

---

## 1. Prerequisites

Install before running anything:

| Tool | Version | Check command |
|------|---------|---------------|
| **JDK** | 17+ | `java -version` |
| **Maven** | 3.6+ | `mvn -version` |
| **MySQL** | 8.0+ | `mysql --version` |
| **Node.js** | 18+ (16+ min) | `node -v` |
| **npm** | 8+ | `npm -v` |
| **Docker** (optional) | Latest | `docker --version` |
| **Docker Compose** (optional) | v2+ | `docker compose version` |
| **Python** (AI local, optional) | 3.11+ | `python3 --version` |

Optional (only if you use AI moderation / chat Kafka):

- **PostgreSQL** 16+ (or use Docker from ai-support)
- **Apache Kafka** (or use Docker from ai-support)

---

## 2. Recommended startup order

For a **minimal** run (blog only — no AI, no Kafka):

```text
1. MySQL          → create blog_db
2. Java backend   → port 8080
3. Angular UI     → port 4400
```

For **full stack** (blog + AI monitoring/security + optional Kafka):

```text
1. MySQL                         → blog_db
2. Python AI API (port 8090)     → REQUIRED for post image/video + AI chat checks
3. Java Spring Boot (8080)       → app.moderation.use-ai-service=true
4. Angular UI (4400)             → create-post shows AI Safety overlay
5. (Optional) Docker ai-support  → Kafka, Redis, PostgreSQL audit, worker
6. (Optional) FFmpeg             → brew install ffmpeg — better video frame analysis
7. (Optional) Tesseract          → brew install tesseract — OCR text in images/video
```

---

## 3. Database — MySQL (main app)

The Spring Boot app uses **MySQL** database `blog_db` on `localhost:3306`.

### Step 3.1 — Start MySQL server

**macOS (Homebrew):**

```bash
brew services start mysql
# or
mysql.server start
```

**Windows:** Start **MySQL80** service from Services.

**Linux:**

```bash
sudo systemctl start mysql
```

### Step 3.2 — Create database and tables

**Option A — Run SQL file:**

```bash
cd "PROJECT_ROOT/Backend"
mysql -u root -p < database_schema.sql
```

**Option B — MySQL shell manually:**

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS blog_db;
USE blog_db;
-- Then paste contents of Backend/database_schema.sql
```

> Hibernate is set to `spring.jpa.hibernate.ddl-auto=update`, so missing tables are often created automatically on first backend start. Running the SQL script is still recommended for a clean setup.

### Step 3.3 — Configure credentials

Edit `Backend/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/blog_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

Use the same username/password you use in `mysql -u root -p`.

### Step 3.4 — (Optional) AI moderation columns on MySQL

Only when you integrate AI moderation into posts/comments/users:

```bash
mysql -u root -p blog_db < "PROJECT_ROOT/Backend/ai-support/database/mysql_app_migrations.sql"
```

---

## 4. Database — PostgreSQL (AI moderation, optional)

Used only by the **ai-support** moderation audit store (`moderation_db`). Skip this section if you are not running AI moderation.

### Step 4.1 — Using Docker (easiest)

PostgreSQL is started by ai-support Docker Compose (port **5433** on host). Schema is applied automatically from `schema.postgresql.sql`. See [Section 5](#5-docker--ai-moderation-stack-optional).

### Step 4.2 — Manual PostgreSQL install

```bash
# Create DB and user
psql -U postgres
```

```sql
CREATE USER moderation WITH PASSWORD 'moderation';
CREATE DATABASE moderation_db OWNER moderation;
\q
```

```bash
psql -U moderation -d moderation_db -f "PROJECT_ROOT/Backend/ai-support/database/schema.postgresql.sql"
```

Connection (for future Java second datasource):

```text
Host: localhost
Port: 5432 (or 5433 if Docker mapped)
Database: moderation_db
User: moderation
Password: moderation
```

---

## 5. Docker — AI moderation stack (optional)

Runs **Zookeeper, Kafka, Redis, PostgreSQL (moderation), MinIO, Prometheus**, and optionally **Python AI API + worker**.

**Folder:** `Backend/ai-support/docker`  
**Compose file:** `docker-compose.yml`

### Step 5.0 — Start Docker Desktop

Open **Docker Desktop** and wait until the engine is running (whale icon ready).

Check:

```bash
docker --version
docker compose version
```

### Step 5.1 — Go to Docker folder

```bash
cd "/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project/Backend/ai-support/docker"
```

(Or: `cd "PROJECT_ROOT/Backend/ai-support/docker"`)

### Step 5.2 — Environment file (first time only)

```bash
cp .env.example .env
```

Optional edit `.env`:

```text
INTERNAL_JWT_SECRET=dev-secret-change-in-prod
COMPOSE_PROJECT_NAME=blog-ai-moderation
```

### Step 5.3 — Fix Docker credentials error (if pull fails)

If you see: `docker-credential-desktop: executable file not found in $PATH`

**macOS / Linux — remove broken creds store (backup created automatically):**

```bash
cp ~/.docker/config.json ~/.docker/config.json.bak
python3 -c "
import json, pathlib
p = pathlib.Path.home() / '.docker/config.json'
d = json.loads(p.read_text())
d.pop('credsStore', None)
p.write_text(json.dumps(d, indent=2))
print('Fixed:', p)
"
```

Then retry `docker compose` commands.

### Step 5.4 — Start infrastructure only (recommended first)

Starts Kafka, Redis, PostgreSQL, MinIO, Prometheus **without** building Python images:

```bash
docker compose up -d zookeeper kafka redis moderation-db minio prometheus
```

Wait ~30 seconds, then check:

```bash
docker compose ps
```

Expected **Up**: `zookeeper`, `kafka`, `redis`, `moderation-db`, `minio`, `prometheus`.

### Step 5.5 — Start full stack (including AI build)

```bash
docker compose up -d --build
```

Or start AI services after infrastructure is up:

```bash
docker compose up -d --build ai-moderation-api ai-moderation-worker
```

If **pip/apt timeout** during build, use [Section 8 — Option B](#84--option-b--python-ai-local-recommended) instead of Docker for Python.

### Step 5.6 — View logs

**All services:**

```bash
docker compose logs -f
```

**Single service (examples):**

```bash
docker compose logs -f kafka
docker compose logs -f moderation-db
docker compose logs -f ai-moderation-api
docker compose logs -f ai-moderation-worker
```

Press `Ctrl+C` to stop following logs.

### Step 5.7 — Verify services

```bash
docker compose ps
```

**Kafka** (broker reachable):

```bash
docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

**PostgreSQL moderation DB:**

```bash
docker compose exec moderation-db psql -U moderation -d moderation_db -c "\dt"
```

**Redis:**

```bash
docker compose exec redis redis-cli ping
```

**AI API health** (only if `ai-moderation-api` container is running):

```bash
curl http://localhost:8090/api/v1/health
```

Expected: `{"status":"UP",...}`

**Prometheus UI:** http://localhost:9090  

**MinIO console:** http://localhost:19001 — login `minioadmin` / `minioadmin`  
**MinIO API:** http://localhost:19000

### Step 5.8 — Restart / rebuild one service

```bash
docker compose restart kafka
docker compose up -d --build ai-moderation-api
```

### Step 5.9 — Stop stack

**Stop containers (keep data volumes):**

```bash
docker compose down
```

**Stop and delete volumes (fresh DB next start):**

```bash
docker compose down -v
```

**Stop and remove images (full cleanup):**

```bash
docker compose down -v --rmi local
```

### Step 5.10 — Enable Kafka in Spring Boot (after Docker Kafka is up)

Edit `Backend/application.properties`:

```properties
spring.kafka.bootstrap-servers=localhost:9092
app.kafka.publish-enabled=true
spring.kafka.listener.auto-startup=true
```

Restart Java backend.

---

## 6. Docker — Kafka only (optional, for chat without full ai-support stack)

Chat Kafka is **disabled by default** (`app.kafka.publish-enabled=false`).

If you already ran [Section 5](#5-docker--ai-moderation-stack-optional), Kafka is on `localhost:9092` — **skip this section**.

**Standalone Kafka (only if not using ai-support compose):**

```bash
docker run -d --name zookeeper -p 2181:2181 confluentinc/cp-zookeeper:7.6.1

docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_BROKER_ID=1 \
  -e KAFKA_ZOOKEEPER_CONNECT=host.docker.internal:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka:7.6.1
```

Then in `Backend/application.properties`:

```properties
app.kafka.publish-enabled=true
spring.kafka.listener.auto-startup=true
```

**Remove standalone containers later:**

```bash
docker stop kafka zookeeper
docker rm kafka zookeeper
```

---

## 7. Java Spring Boot backend

Main API module: `Backend/Blog_mng_app`  
Config file: `Backend/application.properties`  
Default URL: **http://localhost:8080**

### Step 7.1 — Open terminal at Backend folder

```bash
cd "PROJECT_ROOT/Backend"
```

### Step 7.2 — Build all Maven modules

```bash
mvn clean install
```

Wait until `BUILD SUCCESS`. This builds:

- `Blog_mng_api`
- `Blog_mng_sevice`
- `Blog_mng_app`

### Step 7.3 — Export secret key (required for encrypted DB/mail/JWT)

The app decrypts credentials in `application.properties` using **APP_SECRET_KEY**.

**macOS / Linux:**

```bash
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
```

**Windows CMD:**

```cmd
set APP_SECRET_KEY=oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg
```

**Windows PowerShell:**

```powershell
$env:APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
```

> Use the same key that was used to generate `spring.datasource.*.encrypted` values. If decryption fails, see `Backend/SECURITY_ENCRYPTION_GUIDE.md` or temporarily use plain `spring.datasource.username` / `password` in `application.properties`.

### Step 7.4 — Run backend (development — recommended)

```bash
cd Blog_mng_app
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=file:../application.properties"
```

Keep this terminal open. On success you should see:

```text
Application started...
```

**Alternative (run from Backend root):**

```bash
cd "PROJECT_ROOT/Backend"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
mvn spring-boot:run -pl Blog_mng_app -Dspring-boot.run.arguments="--spring.config.location=file:./application.properties"
```

### Step 7.5 — Run backend (production-style JAR)

After `mvn clean install`:

```bash
cd "PROJECT_ROOT/Backend/Blog_mng_app"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
java -jar target/blog-app-0.0.1-SNAPSHOT.jar --spring.config.location=file:../application.properties
```

JAR path after build:

```text
Backend/Blog_mng_app/target/blog-app-0.0.1-SNAPSHOT.jar
```

### Step 7.6 — Confirm backend is up

```bash
curl http://localhost:8080/api/posts
```

Or open in browser: http://localhost:8080/api/posts

### Step 7.7 — (Optional) Enable AI moderation in Java

Merge settings from:

`Backend/ai-support/java-integration/samples/application-moderation.properties.snippet`

into `Backend/application.properties`, then set:

```properties
app.moderation.enabled=true
app.moderation.publish-enabled=true
spring.kafka.listener.auto-startup=true
app.moderation.ai-service-url=http://localhost:8090
```

Requires: Kafka running (Docker ai-support stack) and Java integration classes copied per `Backend/ai-support/java-integration/README.md`.

### Step 7.8 — Uploads folder

Uploaded files are stored under `Backend/uploads/`. Ensure the app can write there (folder is created automatically in most setups).

---

## 8. AI Support module (monitoring & security)

**Folder:** `PROJECT_ROOT/Backend/ai-support/`  
**Python API (required for media + full AI checks):** http://localhost:8090  
**Swagger docs:** http://localhost:8090/docs

### 8.1 — What you need running

| Goal | Start these (in order) |
|------|---------------------------|
| **Blog only** (no AI) | Skip this section. Java + MySQL + Angular are enough ([Section 2](#2-recommended-startup-order) minimal). |
| **AI text + media moderation** (recommended) | [8.4](#84--option-b--python-ai-local-recommended) Python on 8090 → [Section 7](#7-java-spring-boot-backend) Java on 8080 → [Section 9](#9-angular-frontend-ui) Angular on 4400 |
| **AI + Kafka async worker** | [Section 5](#5-docker--ai-moderation-stack-optional) Docker infra (or full stack) → [8.4](#84--option-b--python-ai-local-recommended) or [8.5](#85--option-a--docker-quick-reference) AI API → [8.4.6](#846--optional-kafka-consumer-worker--second-terminal) worker → Java |

### 8.2 — What runs where

| Feature | Java (8080) | Python AI (8090) |
|---------|-------------|------------------|
| Comment safety | `CommentServiceImpl` + `ContentModerationFacade` | `POST /api/v1/moderate/sync` (`COMMENT`) |
| DM chat safety | `ChatServiceImpl` | sync (`CHAT`) |
| Random/anonymous chat | `AnonymousChatServiceImpl` | sync (`ANONYMOUS_CHAT`) |
| Post text + media | `PostServiceImpl` → before file save | `POST /api/v1/moderate/media` (CNN + OCR/RNN) |
| Create-post UI loader | — | Angular **AI Safety Check** overlay |

### 8.3 — Choose how to run Python (8090)

| Path | Best for | See steps |
|------|----------|-----------|
| **A — Docker full stack** | Kafka, Redis, PostgreSQL audit, AI in containers | [Section 5](#5-docker--ai-moderation-stack-optional) then [8.7](#87--verify-ai-is-running) |
| **B — Python local** (most common for dev) | Fast iteration, no Docker image build | [8.4](#84--option-b--python-ai-local-recommended) |
| **C — Docker infra + Python local** | Kafka without building Python in Docker | [Section 5 Step 5.4](#step-54--start-infrastructure-only-recommended-first) + [8.4](#84--option-b--python-ai-local-recommended) |

> If Docker **pip/apt build** fails, use **B** or **C** — do not block on `ai-moderation-api` container build.

### 8.4 — Option B — Python AI local (recommended)

Use **one terminal** for the API. Use a **second terminal** for the Kafka worker only if you need async moderation (Section 5 Kafka up).

**Prerequisites:** Python 3.11+, `pip`. Optional: `ffmpeg` (video), `tesseract` (real OCR) — see `Backend/ai-support/README.md`.

**Step 8.4.1 — Go to the Python service folder**

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
```

**Step 8.4.2 — Virtual environment (first time only)**

```bash
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows PowerShell
```

**Step 8.4.3 — Install dependencies (first time or after requirements change)**

```bash
pip install -r requirements.txt
```

**Step 8.4.4 — Environment file (first time only)**

```bash
cp .env.example .env
```

Default dev settings in `.env`: `DEV_AUTH_BYPASS=true`, token `dev-moderation-token`.  
Edit `.env` only if Redis/Kafka hosts are not `localhost`.

**Step 8.4.5 — Start FastAPI (keep this terminal open)**

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8090
```

Success signs:

- Terminal shows `Uvicorn running on http://0.0.0.0:8090`
- Browser: http://localhost:8090/docs loads Swagger UI

**Step 8.4.6 — (Optional) Kafka consumer worker — second terminal**

Only if Kafka is running on `localhost:9092` ([Section 5 Step 5.4](#step-54--start-infrastructure-only-recommended-first) or full stack):

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
source .venv/bin/activate
export KAFKA_ENABLED=true
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
python -m app.workers.kafka_consumer
```

### 8.5 — Option A — Docker (quick reference)

All detailed commands: [Section 5](#5-docker--ai-moderation-stack-optional).

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
cd "$PROJECT_ROOT/Backend/ai-support/docker"
cp .env.example .env    # first time only

# Infra only (no Python image build):
docker compose up -d zookeeper kafka redis moderation-db minio prometheus

# Full stack including AI API + worker (image blog-ai-moderation:1.1.0):
docker compose up -d --build

# Rebuild latest AI image only — see Section 14.2
# docker compose build --no-cache ai-moderation-api && docker compose up -d ai-moderation-api
```

| Service | URL |
|---------|-----|
| AI API | http://localhost:8090 |
| AI docs | http://localhost:8090/docs |
| Kafka | localhost:9092 |
| Redis | localhost:6379 |
| PostgreSQL (moderation) | localhost:5433 |
| Prometheus | http://localhost:9090 |
| MinIO API | http://localhost:19000 |
| MinIO console | http://localhost:19001 (`minioadmin` / `minioadmin`) |

### 8.6 — Configure Java to call Python (8090)

File: `Backend/application.properties` (repo usually already has this):

```properties
app.moderation.enabled=true
app.moderation.use-ai-service=true
app.moderation.ai-service-url=http://localhost:8090
app.moderation.ai-service-token=dev-moderation-token
app.moderation.ai-timeout-seconds=45
```

**Then start (or restart) the Java backend** — [Section 7](#7-java-spring-boot-backend).

| Python on 8090? | Behavior |
|-----------------|----------|
| **Yes** | Comments, chat, posts use AI (media uses CNN/OCR pipeline). |
| **No** | Text-only posts use local rules; **media** posts skip AI and use text rules only. |

Kafka publishing is optional — see [Step 7.7](#step-77--optional-enable-ai-moderation-in-java) and [Section 5 Step 5.10](#step-510--enable-kafka-in-spring-boot-after-docker-kafka-is-up).

### 8.7 — Verify AI is running

**Health check:**

```bash
curl -s http://localhost:8090/api/v1/health
```

Expected: JSON with `"status":"UP"` (or similar).

**Text moderation (comment/chat):**

```bash
curl -s -X POST http://localhost:8090/api/v1/moderate/sync \
  -H "Authorization: Bearer dev-moderation-token" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"COMMENT","text":"hello world","userName":"demo"}'
```

Expected: JSON with `final_status`: `APPROVED`, `WARNING`, or `BLOCKED`.

**Media moderation (replace with a real JPG on your machine):**

```bash
curl -s -X POST http://localhost:8090/api/v1/moderate/media \
  -H "Authorization: Bearer dev-moderation-token" \
  -F "content_type=POST" \
  -F "text=My vacation photo" \
  -F "file=@/path/to/photo.jpg;type=image/jpeg"
```

**End-to-end in the app:** With Java (8080) + AI (8090) + Angular (4400), create a post in the UI — you should see the **AI Safety Check** overlay, then the post on home if approved.

More checks: [Section 10](#10-verify-everything-works).

> Local dev uses `DEV_AUTH_BYPASS=true` and token `dev-moderation-token` (see `python-ai-service/.env.example`).

### 8.8 — Option C — Python Docker image only (no Compose)

See full build/run steps in [Section 14](#14-docker-images--build-tag-and-run).

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
docker build -t blog-ai-moderation:1.1.0 .
docker run -p 8090:8090 -e KAFKA_ENABLED=false -e DEV_AUTH_BYPASS=true -e DEV_STATIC_TOKEN=dev-moderation-token blog-ai-moderation:1.1.0
```

Then continue with [8.6](#86--configure-java-to-call-python-8090) and [8.7](#87--verify-ai-is-running).

### 8.9 — One-time integration (if moderation code not yet in your tree)

Only if you cloned an older branch without `ContentModerationFacade` / hooks:

1. MySQL: `ai-support/database/mysql_app_migrations.sql`  
2. PostgreSQL (Docker): `ai-support/database/schema.postgresql.sql`  
3. Copy Java samples: `ai-support/java-integration/samples/` → `Blog_mng_sevice` (`com.blog.moderation`)  
4. Merge `application-moderation.properties.snippet` into `application.properties`  
5. Details: `Backend/ai-support/docs/INTEGRATION-GUIDE.md`

Current repo: moderation is already wired in `PostServiceImpl`, `CommentServiceImpl`, chat services — you usually only need **8.4** + **8.6** + Section 7.

### 8.10 — Terminal cheat sheet (full AI dev)

```text
Terminal 1 — MySQL          (Section 3) — if not already running
Terminal 2 — AI Python      uvicorn on 8090 (Step 8.4.5)
Terminal 3 — Java backend   port 8080 (Section 7)
Terminal 4 — Angular        npm start → 4400 (Section 9)
Terminal 5 — (Optional)     Kafka worker (Step 8.4.6) + Docker Kafka (Section 5)
```

---

## 9. Angular frontend UI

Location: `PROJECT_ROOT/frontend`  
Dev server port: **4400** (see `package.json`)  
Proxies `/api`, `/uploads`, `/ws` → `http://localhost:8080`

### Step 9.1 — Install dependencies (first time only)

```bash
cd "PROJECT_ROOT/frontend"
npm install
```

### Step 9.2 — Start development server

**Using npm (uses port 4400):**

```bash
npm start
```

**Or Angular CLI directly:**

```bash
npx ng serve --port 4400 --proxy-config proxy.conf.json
```

### Step 9.3 — Open the app

Browser:

```text
http://localhost:4400
```

> Backend **must** be running on port **8080** before login/posts work.

### Step 9.4 — Production build (optional)

```bash
cd "PROJECT_ROOT/frontend"
npm run build
```

Output folder:

```text
frontend/dist/blog-management-frontend/
```

Serve with any static server; configure API base URL to your backend (production usually uses nginx reverse proxy, not `proxy.conf.json`).

---

## 10. Verify everything works

| Check | URL / Command | Expected |
|-------|----------------|----------|
| MySQL | `mysql -u root -p -e "USE blog_db; SHOW TABLES;"` | Tables: users, posts, comments, likes, … |
| Backend | http://localhost:8080/api/posts | JSON (array, may be empty) |
| Frontend | http://localhost:4400 | Login / home page loads |
| Register user | UI → Register | Success, redirect/login |
| Create post | UI → Create post | AI overlay → post appears on home |
| Post blocked | Publish post with toxic text | 400 + moderation message |
| AI media API | `curl` [Step 8.7](#87--verify-ai-is-running) media test | `final_status` in JSON |
| AI health | http://localhost:8090/api/v1/health | `{"status":"UP",...}` |
| Kafka (optional) | `docker compose ps` in ai-support/docker | kafka container healthy |

---

## 11. Ports reference

| Service | Port | Notes |
|---------|------|--------|
| Spring Boot API | **8080** | Main backend |
| Angular dev server | **4400** | Frontend (`npm start`) |
| MySQL | **3306** | Database `blog_db` |
| AI FastAPI | **8090** | ai-support Python |
| Kafka | **9092** | Chat + moderation events |
| Redis | **6379** | AI cache |
| PostgreSQL (moderation) | **5433** | Host mapped from Docker |
| MinIO API | **19000** | Object storage (Docker; avoids port 9000 conflicts) |
| MinIO Console | **19001** | Web UI (`minioadmin` / `minioadmin`) |
| Prometheus | **9090** | Metrics (Docker stack; conflicts with AI metrics path — use different host port in compose if needed) |
| Zookeeper | **2181** | Kafka dependency |

---

## 12. Troubleshooting

### Backend fails: database connection

- MySQL is running: `mysql -u root -p`  
- Database `blog_db` exists  
- Username/password in `application.properties` match MySQL  
- `APP_SECRET_KEY` is exported if using encrypted properties  

### Backend fails: decrypt / SecretsConfig error

```bash
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
```

Or comment out `*.encrypted` lines and use plain `spring.datasource.username` / `password` for local dev only.

### Frontend: API calls fail / CORS / 404

- Backend must run on **8080**  
- Use `npm start` (port **4400**) so `proxy.conf.json` forwards `/api` to backend  
- Do not open `file://` — always use `http://localhost:4400`  

### `mvn clean install` fails

- JDK 17+: `java -version`  
- Run from `Backend/` folder (parent `pom.xml`)  
- Delete corrupted local repo only as last resort: `rm -rf ~/.m2/repository/com/dp`  

### Docker: `docker-credential-desktop` not found

See [Step 5.3](#step-53--fix-docker-credentials-error-if-pull-fails) in this file.

### Docker: port already in use

Find what is using the port (macOS):

```bash
lsof -i :9092
lsof -i :8090
lsof -i :5433
lsof -i :19000
```

Stop the other process, or change ports in `Backend/ai-support/docker/docker-compose.yml`, then:

```bash
cd "PROJECT_ROOT/Backend/ai-support/docker"
docker compose down
docker compose up -d zookeeper kafka redis moderation-db minio prometheus
```

### Docker: AI image build fails (pip/apt timeout)

Start infrastructure only ([Section 5.4](#step-54--start-infrastructure-only-recommended-first)), then run Python on the host ([Section 8 — Option B](#84--option-b--python-ai-local-recommended)).

Retry build later:

```bash
cd "PROJECT_ROOT/Backend/ai-support/docker"
docker compose build --no-cache ai-moderation-api
docker compose up -d ai-moderation-api ai-moderation-worker
```

### Docker: container exits immediately

```bash
docker compose ps -a
docker compose logs ai-moderation-api
docker compose logs kafka
```

### AI worker not processing events

- Kafka running on `9092`  
- Topics exist: `moderation.requested`, `moderation.completed`  
- `KAFKA_ENABLED=true` for worker  
- Java has `app.moderation.publish-enabled=true`  

### Email not sending

SMTP is configured in `application.properties` (Gmail). For local dev, email failures may appear in logs but the rest of the app still works. Use app passwords for Gmail or disable mail-dependent features.

---

## 13. All local commands (copy-paste)

Run these on your machine **without Docker** (except optional Kafka infra). Set the project path once:

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
cd "$PROJECT_ROOT"
```

### 13.1 — Prerequisites check

```bash
java -version
mvn -version
mysql --version
node -v
npm -v
python3 --version
docker --version
docker compose version
```

### 13.2 — MySQL (database)

```bash
# Start MySQL (macOS Homebrew)
brew services start mysql

# Create database + tables (enter password when prompted)
mysql -u root -p < "$PROJECT_ROOT/Backend/database_schema.sql"

# Verify
mysql -u root -p -e "USE blog_db; SHOW TABLES;"

# Optional: AI moderation columns on MySQL
mysql -u root -p blog_db < "$PROJECT_ROOT/Backend/ai-support/database/mysql_app_migrations.sql"
```

### 13.3 — Python AI (local — port 8090)

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"

# First time only
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp -n .env.example .env

# Optional system tools (macOS) — better video/OCR
# brew install ffmpeg tesseract

# Start API (keep terminal open)
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8090
```

**Second terminal — Kafka worker (only if Kafka on 9092 is running):**

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
source .venv/bin/activate
export KAFKA_ENABLED=true
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
python -m app.workers.kafka_consumer
```

**Test AI locally:**

```bash
curl -s http://localhost:8090/api/v1/health

curl -s -X POST http://localhost:8090/api/v1/moderate/sync \
  -H "Authorization: Bearer dev-moderation-token" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"COMMENT","text":"hello","userName":"demo"}'

# Block test (should return BLOCKED)
curl -s -X POST http://localhost:8090/api/v1/moderate/sync \
  -H "Authorization: Bearer dev-moderation-token" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"POST","text":"fucking post\nfuck you","userName":"demo"}'

# Media test — replace path with a real image on your Mac
curl -s -X POST http://localhost:8090/api/v1/moderate/media \
  -H "Authorization: Bearer dev-moderation-token" \
  -F "content_type=POST" \
  -F "text=Test post" \
  -F "file=@/path/to/your/image.jpg;type=image/jpeg"
```

**Test CNN/RNN on a sample upload (if file exists in repo):**

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
source .venv/bin/activate
python -c "
from pathlib import Path
from app.pipelines.image_pipeline import analyze_image_bytes
from app.pipelines.text_pipeline import analyze_text
from app.core.decision_engine import aggregate_decision
uploads = Path('$PROJECT_ROOT/Backend/uploads')
imgs = list(uploads.glob('*.jpeg')) + list(uploads.glob('*.jpg'))
if imgs:
    s = analyze_image_bytes(imgs[0].read_bytes())
    t, _ = analyze_text('fucking post fuck you')
    r = aggregate_decision(s + t, is_comment=False)
    print('IMAGE', s); print('TEXT', t); print('FINAL', r.final_status)
else:
    print('No images in Backend/uploads — skip')
"
```

### 13.4 — Java Spring Boot (port 8080)

```bash
cd "$PROJECT_ROOT/Backend"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"

# Build all modules
mvn clean install

# Run (development)
cd Blog_mng_app
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=file:../application.properties"
```

**Alternative — run from Backend root:**

```bash
cd "$PROJECT_ROOT/Backend"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
mvn spring-boot:run -pl Blog_mng_app -Dspring-boot.run.arguments="--spring.config.location=file:./application.properties"
```

**Alternative — JAR:**

```bash
cd "$PROJECT_ROOT/Backend/Blog_mng_app"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
java -jar target/blog-app-0.0.1-SNAPSHOT.jar --spring.config.location=file:../application.properties
```

**Verify backend:**

```bash
curl -s http://localhost:8080/api/posts
```

**Required AI settings** in `Backend/application.properties`:

```properties
app.moderation.enabled=true
app.moderation.use-ai-service=true
app.moderation.ai-service-url=http://localhost:8090
app.moderation.ai-service-token=dev-moderation-token
app.moderation.ai-timeout-seconds=45
```

### 13.5 — Angular frontend (port 4400)

```bash
cd "$PROJECT_ROOT/frontend"

# First time only
npm install

# Start dev server
npm start

# Or explicitly:
npx ng serve --port 4400 --proxy-config proxy.conf.json
```

**Open:** http://localhost:4400

**Production build (optional):**

```bash
cd "$PROJECT_ROOT/frontend"
npm run build
```

### 13.6 — Full local stack — terminal map

Run in this order (each block = separate terminal):

```text
┌────────┬─────────────────────────────────────────────────────────────┐
│ Term 1 │ MySQL (brew services start mysql) — once                    │
├────────┼─────────────────────────────────────────────────────────────┤
│ Term 2 │ Python AI: uvicorn on :8090  (Section 13.3)                 │
├────────┼─────────────────────────────────────────────────────────────┤
│ Term 3 │ Java: mvn spring-boot:run on :8080  (Section 13.4)          │
├────────┼─────────────────────────────────────────────────────────────┤
│ Term 4 │ Angular: npm start on :4400  (Section 13.5)                 │
├────────┼─────────────────────────────────────────────────────────────┤
│ Term 5 │ (Optional) Kafka worker — only with Docker Kafka on :9092   │
└────────┴─────────────────────────────────────────────────────────────┘
```

**One-liner startup reminder:**

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
# Term 2: cd $PROJECT_ROOT/Backend/ai-support/python-ai-service && source .venv/bin/activate && uvicorn app.main:app --reload --port 8090
# Term 3: cd $PROJECT_ROOT/Backend/Blog_mng_app && export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg" && mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=file:../application.properties"
# Term 4: cd $PROJECT_ROOT/frontend && npm start
```

---

## 14. Docker images — build, tag, and run

Use this section when you want AI + Kafka + Redis in containers. Image name: **`blog-ai-moderation:1.1.0`** (CNN, gesture detector, text RNN, FFmpeg, Tesseract).

### 14.1 — One-time setup

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
cd "$PROJECT_ROOT/Backend/ai-support/docker"

# Environment file (first time)
cp -n .env.example .env

# Optional: edit .env
# INTERNAL_JWT_SECRET=dev-secret-change-in-prod
# DEV_STATIC_TOKEN=dev-moderation-token
```

**Fix Docker credential error (if pull/build fails on macOS):**

```bash
cp ~/.docker/config.json ~/.docker/config.json.bak
python3 -c "
import json, pathlib
p = pathlib.Path.home() / '.docker/config.json'
d = json.loads(p.read_text())
d.pop('credsStore', None)
p.write_text(json.dumps(d, indent=2))
print('Fixed:', p)
"
```

### 14.2 — Build AI Docker image (latest)

**Option A — Build with Docker Compose (recommended):**

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"

# Build only the AI API image (tag: blog-ai-moderation:1.1.0)
docker compose build --no-cache ai-moderation-api

# Verify image exists
docker images | grep blog-ai-moderation
```

**Option B — Build directly from Dockerfile:**

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"

docker build --no-cache -t blog-ai-moderation:1.1.0 .

# Optional extra tags
docker tag blog-ai-moderation:1.1.0 blog-ai-moderation:latest
```

**Option C — Build worker image (same Dockerfile, different command at run):**

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"
docker compose build --no-cache ai-moderation-api ai-moderation-worker
```

### 14.3 — Run Docker infrastructure only (no AI build)

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"

docker compose up -d zookeeper kafka redis moderation-db minio prometheus

docker compose ps
```

Then run Python **locally** on 8090 ([Section 13.3](#133--python-ai-local--port-8090)).

### 14.4 — Run full Docker stack (infra + AI API + worker)

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"

# Build and start everything
docker compose up -d --build

# Or: infra first, then AI after infra is healthy
docker compose up -d zookeeper kafka redis moderation-db minio prometheus
sleep 30
docker compose up -d --build ai-moderation-api ai-moderation-worker
```

### 14.5 — Start / stop / restart AI containers

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"

# Start AI API only
docker compose up -d ai-moderation-api

# Start API + Kafka worker
docker compose up -d ai-moderation-api ai-moderation-worker

# Restart after code change (rebuild + restart)
docker compose build --no-cache ai-moderation-api
docker compose up -d --force-recreate ai-moderation-api

# View logs
docker compose logs -f ai-moderation-api
docker compose logs -f ai-moderation-worker

# Stop all services (keep volumes)
docker compose down

# Stop and delete volumes (fresh DB next time)
docker compose down -v

# Remove local images (full cleanup)
docker compose down -v --rmi local
```

### 14.6 — Verify Docker AI

```bash
curl -s http://localhost:8090/api/v1/health

docker compose -f "$PROJECT_ROOT/Backend/ai-support/docker/docker-compose.yml" ps

# Kafka topics (optional)
cd "$PROJECT_ROOT/Backend/ai-support/docker"
docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Redis ping
docker compose exec redis redis-cli ping
```

### 14.7 — Run AI container without Compose (standalone)

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"

docker build -t blog-ai-moderation:1.1.0 .

docker run -d --name blog-ai-api \
  -p 8090:8090 \
  -e DEV_AUTH_BYPASS=true \
  -e DEV_STATIC_TOKEN=dev-moderation-token \
  -e KAFKA_ENABLED=false \
  -e MODEL_BUNDLE_VERSION=1.1.0 \
  blog-ai-moderation:1.1.0

curl -s http://localhost:8090/api/v1/health

# Stop/remove
docker stop blog-ai-api && docker rm blog-ai-api
```

### 14.8 — Push image to a registry (optional — production)

```bash
# Example: Docker Hub (replace YOUR_USER)
docker tag blog-ai-moderation:1.1.0 YOUR_USER/blog-ai-moderation:1.1.0
docker login
docker push YOUR_USER/blog-ai-moderation:1.1.0

# Example: AWS ECR (replace ACCOUNT and REGION)
# aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGION.amazonaws.com
# docker tag blog-ai-moderation:1.1.0 ACCOUNT.dkr.ecr.REGION.amazonaws.com/blog-ai-moderation:1.1.0
# docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/blog-ai-moderation:1.1.0
```

### 14.9 — Docker + Java + Angular (complete order)

```text
1. docker compose build ai-moderation-api     →  Section 14.2
2. docker compose up -d ai-moderation-api       →  Section 14.4
3. curl http://localhost:8090/api/v1/health   →  Section 14.6
4. mvn spring-boot:run (Java :8080)             →  Section 13.4
5. npm start (Angular :4400)                    →  Section 13.5
```

---

## Related documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `Backend/README.md` | Backend modules & SQL |
| `Backend/UI_HANDOFF.md` | REST API for UI |
| `Backend/SECURITY_ENCRYPTION_GUIDE.md` | Secrets & encryption |
| `Backend/ai-support/README.md` | AI moderation platform |
| `Backend/ai-support/docs/INTEGRATION-GUIDE.md` | Wire AI into Java |
| `Backend/ai-support/docs/IMPLEMENTATION-PHASES.md` | Rollout phases |

---

*Last updated for: Spring Boot 3.1.1, Angular 20, Java 17, ai-support `blog-ai-moderation:1.1.0`.*
