# Module: `blog-api` (`Blog_mng_api`)

**Purpose:** Shared API surface for the blog platform: REST controllers, service **interfaces**, JPA **entity models**, request/response DTOs, security-related config, and crypto helpers. The **implementations** of services live in the `blog-service` module.

**Packaging:** Maven artifact `blog-api` (JAR). Depends on Spring Web, Spring Data JPA (for JPA annotations on entities), Lombok.

---

## Package layout

| Package | Role |
|---------|------|
| `com.blog.controller` | REST controllers (`@RestController`) |
| `com.blog.service` | Service interfaces (implemented in `blog-service`) |
| `com.blog.model` | JPA entities and simple DTOs used in APIs |
| `com.blog.event` | Domain events published from services (e.g. chat → Kafka bridge) |
| `com.blog.config` | Web, datasource, secrets configuration |
| `com.blog.util` | Crypto and secret-generation utilities |

---

## File-by-file explanations

### Controllers (`com.blog.controller`)

| File | Explanation |
|------|-------------|
| `AuthController.java` | `POST /api/auth/register` and `POST /api/auth/login`. Registers or logs in users via `UserService`, attaches a simple in-memory `token` on the returned `User`. |
| `UserController.java` | `GET/PUT /api/users/{id}`, list all users, profile/background image uploads (`multipart/form-data`, `file` part). |
| `PostController.java` | `GET/POST /api/posts`, `GET /api/posts/{id}`, `GET /api/posts/popular`. Creates posts from multipart JSON part `post` + optional `file` + `userId`. |
| `CommentController.java` | `GET/POST` comments under `/api/posts/{postId}/comments`; `userId` query param for creating comments. |
| `LikeController.java` | `POST /api/posts/{postId}/like` with `userId` to toggle like. |
| `followersAndFollowingController.java` | Follow/unfollow, follower/following lists and counts, follow relationship checks. |
| `ChatController.java` | Direct messaging: send message, get thread, inbox (`ConversationSummary`), mark read, unread count. |
| `FileController.java` | Serves files from disk under `/uploads/{fileName}` with appropriate content type. |
| `HomeController.java` | Server-side MVC routes (`/`, `/login`, `/signup`) returning Thymeleaf-style view names (HTML templates). |

### Service interfaces (`com.blog.service`)

| File | Explanation |
|------|-------------|
| `UserService.java` | User registration, login, profile CRUD, token helpers, list users. |
| `PostService.java` | Post listing, single post, create with author, popular posts. |
| `CommentService.java` | Comments for a post, add comment. |
| `LikeService.java` | Toggle like for a user/post pair. |
| `followersAndFollowingService.java` | Follow graph operations and lists. |
| `ChatService.java` | Send message, conversation thread, inbox summaries, mark read, unread count. |
| `FileStorageService.java` | Abstraction for storing uploaded files (implemented in service module). |
| `CryptoService.java` | Encryption/decryption helpers for configuration secrets. |
| `ExampleEncryptedConfigService.java` | Example wiring for reading encrypted config values. |

### Models (`com.blog.model`)

| File | Explanation |
|------|-------------|
| `User.java` | JPA `users` table: profile fields, `passwordHash`, optional transient `password` for input, `token` for simple auth response. |
| `Post.java` | Blog post: title, content, media URLs, category, tags, relation to `User`. |
| `Comment.java` | Comment on a post; links to `User` and `Post`. |
| `Like.java` | Unique like per user per post. |
| `followsAndFollowing.java` | Follow relationship row (follower / followed user ids). |
| `ChatMessage.java` | DM row: sender, receiver, text, timestamps, `readAt` for read receipts. |
| `ConversationSummary.java` | Non-entity DTO: other user + last message + unread count for inbox API. |
| `SendMessageRequest.java` | JSON body for `POST /api/chat/messages` (`senderId`, `receiverId`, `content`). |

### Events (`com.blog.event`)

| File | Explanation |
|------|-------------|
| `ChatMessageDeliveredEvent.java` | Published after a chat message is saved; consumed by Kafka bridge **after commit** so DB and messaging stay ordered. |

### Config (`com.blog.config`)

| File | Explanation |
|------|-------------|
| `WebConfig.java` | CORS, interceptors, static resource rules for the web tier. |
| `AuthInterceptor.java` | Optional request interception for auth (if extended for token checks). |
| `DataSourceConfig.java` | Builds `DataSource` using plain or decrypted DB credentials. |
| `SecretsConfig.java` | Loads or resolves encrypted secrets for mail, JWT, etc. |

### Utilities (`com.blog.util`)

| File | Explanation |
|------|-------------|
| `CryptoUtil.java` | AES (or project-specific) encrypt/decrypt for secrets at rest. |
| `GenerateEncryptedSecrets.java` | CLI-style helper to produce encrypted strings for `application.properties`. |

---

## Related documentation

- [Backend docs index](../docs/README.md)
- [blog-service module README](../Blog_mng_sevice/README.md) (implementations and repositories)
- [UI_HANDOFF.md](../UI_HANDOFF.md) (REST API for frontends)
