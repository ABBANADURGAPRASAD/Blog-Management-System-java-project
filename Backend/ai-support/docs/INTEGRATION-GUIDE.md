# Integration Guide — Wiring AI Moderation into Blog_mng

## 1. Prerequisites

- Kafka running (`spring.kafka.bootstrap-servers`)
- PostgreSQL `moderation_db` created from `database/schema.postgresql.sql`
- Python AI service on port `8090` (or Docker Compose)
- Copy properties from `java-integration/samples/application-moderation.properties.snippet` into `Backend/application.properties`

## 2. MySQL app schema migrations

Run on your existing `blog_db` (MySQL):

```sql
ALTER TABLE posts
  ADD COLUMN moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN moderation_request_id CHAR(36) NULL,
  ADD INDEX idx_posts_moderation_status (moderation_status);

ALTER TABLE comments
  ADD COLUMN moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN moderation_request_id CHAR(36) NULL,
  ADD INDEX idx_comments_moderation_status (moderation_status);

ALTER TABLE users
  ADD COLUMN moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN moderation_request_id CHAR(36) NULL;
```

Enum values: `PENDING_MODERATION`, `APPROVED`, `WARNING`, `BLOCKED`.

## 3. Java package placement

Copy/adapt samples from `java-integration/samples/` into `Blog_mng_sevice`:

| Sample | Target package |
|--------|----------------|
| `ModerationOrchestrator.java` | `com.blog.moderation` |
| `ModerationKafkaProducer.java` | `com.blog.moderation.kafka` |
| `ModerationResultConsumer.java` | `com.blog.moderation.kafka` |
| Events | `com.blog.moderation.event` |

Add `@ComponentScan` already covers `com.blog` via `BlogApplication`.

## 4. Service hooks

### PostServiceImpl.createPost / updatePost

After `postRepository.save(post)`:

```java
moderationOrchestrator.submitPost(saved, mentionIds);
```

Set status before save:

```java
post.setModerationStatus(ModerationStatus.PENDING_MODERATION);
```

### CommentServiceImpl.addComment / updateComment

Same pattern with `ModerationContentType.COMMENT`.

### UserServiceImpl (register, update profile, bio, avatar)

- **Register:** sync check `userName` + `fullName` via `ModerationSyncClient` before commit.
- **Bio/avatar update:** async `USER_BIO` / `USER_AVATAR`.

### FileController uploads

After file stored to `uploads/`:

```java
moderationOrchestrator.submitMedia(userId, storedPath, mediaType);
```

## 5. Read path filtering

In `PostRepository` / custom queries:

```java
@Query("SELECT p FROM Post p WHERE p.moderationStatus = 'APPROVED' OR p.user.id = :viewerId")
List<Post> findVisiblePosts(@Param("viewerId") Long viewerId);
```

Comments on blocked posts should not render.

## 6. Angular (frontend)

1. Add `moderationStatus` to post/comment models.
2. Show badge: Pending / Under review / Warning / Removed.
3. Poll `GET /api/moderation/status/{requestId}` until not `PENDING` (or WebSocket later).
4. On create post, expect `202` with `{ "moderationStatus": "PENDING_MODERATION" }`.

## 7. Feature flags

```properties
app.moderation.enabled=true
app.moderation.block-on-failure=true
app.moderation.sync-username-check=true
```

Disable in dev with `app.moderation.enabled=false` to preserve current behavior.

## 8. Testing checklist

- [ ] Create post with clean text → APPROVED within SLA
- [ ] Create comment with toxic text (test fixture) → BLOCKED
- [ ] Upload NSFW test image (use standard test corpus) → BLOCKED
- [ ] Kafka down → outbox rows accumulate, drain when up
- [ ] Duplicate event → idempotency_key prevents double update
