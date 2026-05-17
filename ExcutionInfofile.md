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
8. [AI Support module](#8-ai-support-module)
9. [Angular frontend UI](#9-angular-frontend-ui)
10. [Verify everything works](#10-verify-everything-works)
11. [Ports reference](#11-ports-reference)
12. [Troubleshooting](#12-troubleshooting)

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

For **full stack** (blog + AI moderation + Kafka):

```text
1. MySQL                    → blog_db
2. Docker (ai-support)      → Kafka, Redis, PostgreSQL, Python AI
3. PostgreSQL migrations    → moderation_db (if not using Docker init)
4. Java backend             → with moderation properties enabled
5. Python Kafka worker      → if not using Docker worker container
6. Angular UI
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

If **pip/apt timeout** during build, use [Section 8 — Option B](#option-b--run-python-ai-locally-without-docker-for-python) instead of Docker for Python.

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

## 8. AI Support module

Location: `Backend/ai-support/`  
Python API default: **http://localhost:8090**

### Option A — Run everything with Docker

All commands are in [Section 5](#5-docker--ai-moderation-stack-optional). Quick reference:

| Service | URL |
|---------|-----|
| AI API | http://localhost:8090 |
| AI docs (Swagger) | http://localhost:8090/docs |
| Kafka | localhost:9092 |
| Redis | localhost:6379 |
| PostgreSQL (moderation) | localhost:5433 |
| Prometheus | http://localhost:9090 |
| MinIO API | http://localhost:19000 |
| MinIO console | http://localhost:19001 (`minioadmin` / `minioadmin`) |

### Option B — Run Python AI locally (without Docker for Python)

**Step 8.1 — Virtual environment**

```bash
cd "PROJECT_ROOT/Backend/ai-support/python-ai-service"
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows
```

**Step 8.2 — Install dependencies**

```bash
pip install -r requirements.txt
```

**Step 8.3 — Environment variables**

```bash
cp .env.example .env
```

Edit `.env` if Kafka/Redis hosts differ.

**Step 8.4 — Start FastAPI server**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8090
```

**Step 8.5 — Start Kafka consumer worker** (second terminal, same venv)

Requires Kafka on `localhost:9092` (start Docker Compose from Section 5 first).

```bash
cd "PROJECT_ROOT/Backend/ai-support/python-ai-service"
source .venv/bin/activate
export KAFKA_ENABLED=true
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
python -m app.workers.kafka_consumer
```

**Step 8.6 — Test sync moderation API**

```bash
curl -X POST http://localhost:8090/api/v1/moderate/sync \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"COMMENT","text":"hello world"}'
```

> `/moderate/sync` requires a valid internal JWT in production; for local stub testing, temporarily adjust `INTERNAL_JWT_SECRET` in `.env` or use Docker stack defaults.

### Option C — Build Python Docker image only

```bash
cd "PROJECT_ROOT/Backend/ai-support/python-ai-service"
docker build -t blog-ai-moderation:local .
docker run -p 8090:8090 -e KAFKA_ENABLED=false blog-ai-moderation:local
```

### AI Support — integrate with Java (one-time dev setup)

1. Run MySQL migration: `ai-support/database/mysql_app_migrations.sql`  
2. Run PostgreSQL schema: `ai-support/database/schema.postgresql.sql`  
3. Copy Java files from `ai-support/java-integration/samples/` → `Blog_mng_sevice` (`com.blog.moderation`)  
4. Merge `application-moderation.properties.snippet` into `application.properties`  
5. Hook `PostServiceImpl` / `CommentServiceImpl` (see `PostModerationHook.java`)  
6. Full details: `Backend/ai-support/docs/INTEGRATION-GUIDE.md`

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
| Create post | UI → Create post | Post appears after save |
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

Start infrastructure only ([Section 5.4](#step-54--start-infrastructure-only-recommended-first)), then run Python on the host ([Section 8 — Option B](#option-b--run-python-ai-locally-without-docker-for-python)).

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

## Quick command cheat sheet (copy-paste)

Set project path once (macOS — adjust if your folder differs):

```bash
export PROJECT_ROOT="/Users/ent-00210/Desktop/Project Documents/Blog-Management-System-java-project"
```

**Terminal 1 — MySQL** (once):

```bash
mysql -u root -p < "$PROJECT_ROOT/Backend/database_schema.sql"
```

**Terminal 2 — Docker (infrastructure)** (optional):

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"
cp -n .env.example .env
docker compose up -d zookeeper kafka redis moderation-db minio prometheus
docker compose ps
```

**Terminal 2b — Docker AI containers** (optional, if build succeeds):

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"
docker compose up -d --build ai-moderation-api ai-moderation-worker
curl http://localhost:8090/api/v1/health
```

**Terminal 2c — Python AI local** (if Docker AI build fails):

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp -n .env.example .env
uvicorn app.main:app --reload --port 8090
```

**Terminal 2d — Python Kafka worker** (second shell, with Kafka from Docker):

```bash
cd "$PROJECT_ROOT/Backend/ai-support/python-ai-service"
source .venv/bin/activate
export KAFKA_ENABLED=true KAFKA_BOOTSTRAP_SERVERS=localhost:9092
python -m app.workers.kafka_consumer
```

**Terminal 3 — Java backend:**

```bash
cd "$PROJECT_ROOT/Backend"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
mvn clean install
cd Blog_mng_app
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=file:../application.properties"
```

**Terminal 3b — Java JAR (alternative):**

```bash
cd "$PROJECT_ROOT/Backend/Blog_mng_app"
export APP_SECRET_KEY="oAxGuIhSpp8OSIlTUs1FwdmWy4XvvY7yQMQ/OwIgUVg"
java -jar target/blog-app-0.0.1-SNAPSHOT.jar --spring.config.location=file:../application.properties
```

**Terminal 4 — Angular UI:**

```bash
cd "$PROJECT_ROOT/frontend"
npm install
npm start
```

**Browser:** http://localhost:4400  

**Stop Docker when done:**

```bash
cd "$PROJECT_ROOT/Backend/ai-support/docker"
docker compose down
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

*Last updated for: Spring Boot 3.1.1, Angular 20, Java 17, ai-support module.*
