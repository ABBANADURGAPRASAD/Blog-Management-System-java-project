# Module: `blog-service` (`Blog_mng_sevice`)

**Purpose:** Implements business logic declared in `blog-api` service interfaces: Spring `@Service` classes, Spring Data **repositories**, **Kafka** producers/consumers for chat delivery, and file storage implementation.

**Packaging:** Maven artifact `blog-service` (JAR). Depends on `blog-api`, `spring-boot-starter-data-jpa`, `spring-kafka`, `spring-boot-starter-json`, MySQL driver, Lombok.

**Note:** The folder name uses the typo `sevice`; the Maven artifact id is `blog-service`.

---

## Package layout

| Package | Role |
|---------|------|
| `com.blog.service.impl` | `@Service` implementations |
| `com.blog.repository` | `JpaRepository` interfaces |
| `com.blog.kafka` | Kafka configuration and chat delivery pipeline |

---

## File-by-file explanations

### Service implementations (`com.blog.service.impl`)

| File | Explanation |
|------|-------------|
| `UserServiceImpl.java` | Registration, login, profile updates, image URL updates, in-memory token map, `getAllUsers()` via `UserRepository.findAll()`. |
| `PostServiceImpl.java` | Loads/saves posts, attaches author user, computes popular posts (likes + comments). |
| `CommentServiceImpl.java` | Lists and creates comments for a post. |
| `LikeServiceImpl.java` | Idempotent toggle like (insert/delete like row). |
| `followersAndFollowingServiceImpl.java` | Follow/unfollow, follower and following lists and counts using `followersAndFollowingRepository` and `UserRepository`. |
| `ChatServiceImpl.java` | Validates send, persists `ChatMessage`, publishes `ChatMessageDeliveredEvent` for Kafka after save; inbox aggregation; mark read; unread counts. |

### Repositories (`com.blog.repository`)

| File | Explanation |
|------|-------------|
| `UserRepository.java` | CRUD and `findByEmail`, `existsByEmail`, optional username listing query. |
| `PostRepository.java` | Post CRUD + queries for popular posts. |
| `CommentRepository.java` | Comments by post id. |
| `LikeRepository.java` | Likes by post/user; uniqueness for toggle. |
| `followersAndFollowingRepository.java` | Follow rows: counts, lists, find pair for follow/unfollow. |
| `ChatMessageRepository.java` | Conversation between two users, inbox scan, unread counts, bulk mark-as-read update. |

**Legacy / empty stubs (safe to delete if unused):** `chatRepository.java` — should not duplicate `ChatMessageRepository`; remove if still an empty stub.

### Kafka (`com.blog.kafka`)

| File | Explanation |
|------|-------------|
| `ChatKafkaConfig.java` | Enables Kafka with `@EnableKafka`; declares `NewTopic` for `app.kafka.chat-topic`. |
| `ChatKafkaDeliveryBridge.java` | Listens for `ChatMessageDeliveredEvent` **after transaction commit** and sends JSON to Kafka (String key/value). Logs errors without rolling back DB. |
| `ChatKafkaDeliveryConsumer.java` | `@KafkaListener` on the chat topic — placeholder for push/WebSocket; extend for real-time delivery. |

---

## Related documentation

- [blog-api module README](../Blog_mng_api/README.md) (interfaces and controllers)
- [Config and root files](../docs/CONFIG-AND-ROOT-FILES.md) (`application.properties`, Kafka broker URL)
- [Backend docs index](../docs/README.md)
