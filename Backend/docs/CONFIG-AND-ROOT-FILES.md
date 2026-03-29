# Root and configuration files (explanations)

Short descriptions of important files that live **outside** the Maven modules or at the Backend root.

---

## `Backend/application.properties`

Spring Boot configuration loaded when the app runs from the `Blog_mng_app` module (classpath includes this file when copied or referenced).

- **Database**: MySQL URL, username, password, driver; JPA/Hibernate `ddl-auto`, dialect, SQL logging.
- **Email**: SMTP host, port, credentials (often overridden by encrypted values in production-style setups).
- **Server**: `server.port` (default 8080).
- **Secrets / JWT**: Placeholders or encrypted entries for secrets used by custom config classes.
- **Multipart**: Upload size limits for posts and profile images.
- **Kafka**: `spring.kafka.bootstrap-servers`, consumer group, serializers, and `app.kafka.chat-topic` for chat message delivery.

---

## `Backend/UI_HANDOFF.md`

Human-readable **API reference for UI developers**: base URL, request/response shapes, query parameters, and notes (CORS, image URLs, tokens). Updated when REST endpoints change. Not a substitute for OpenAPI/Swagger, but the project’s canonical narrative API doc.

---

## `Backend/SECURITY_ENCRYPTION_GUIDE.md`

Guide for encrypting secrets, database passwords, and related security practices used with this codebase (if present in your tree). Read alongside `CryptoUtil`, `SecretsConfig`, and encrypted properties.

---

## `Backend/pom.xml` (parent)

Multi-module Maven parent: defines Spring Boot version, Java version, Lombok, and lists child modules `Blog_mng_api`, `Blog_mng_sevice`, `Blog_mng_app`.

---

## `Backend/README.md`

High-level backend readme: module names, sample SQL, how to build with Maven, and a shorter endpoint list (may lag behind `UI_HANDOFF.md`).
