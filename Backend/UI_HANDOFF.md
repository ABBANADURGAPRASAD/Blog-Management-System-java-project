# Backend API Guide for UI Developers

**Base URL**: `http://localhost:8080`

---

## 1. Authentication

### Register User
- **Endpoint**: `POST /api/auth/register`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "secretpassword",
    "userName": "johndoe",
    "bio": "Java Developer",
    "phoneNumber": "1234567890",
    "twitterUrl": "http://twitter.com/john",
    "linkedinUrl": "http://linkedin.com/in/john",
    "profileImageUrl": "http://example.com/image.jpg"
  }
  ```
- **Response**: Created `User` object with `token` set. Store `id` and `token` for subsequent requests.

### Login User
- **Endpoint**: `POST /api/auth/login`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "secretpassword"
  }
  ```
- **Response**: `User` object with `token` set. Use `401` if credentials invalid.
- **Note**: Store returned `id` and `token` for authenticated requests.

---

## 2. Posts

### Get All Posts
- **Endpoint**: `GET /api/posts`
- **Response**: Array of `Post` objects.

### Get Post by ID
- **Endpoint**: `GET /api/posts/{id}`
- **Response**: Single `Post` object, or `404` if not found.

### Create Post
- **Endpoint**: `POST /api/posts`
- **Content-Type**: `multipart/form-data`
- **Payload**:
  - `post` (Key): **JSON string** (e.g. `Content-Type: application/json`).
    ```json
    {
      "title": "My New Blog Post",
      "content": "This is the content...",
      "category": "Tech",
      "tags": "java, spring"
    }
    ```
  - `file` (Key): **File** (optional). Image/video/PDF; sets `mediaUrl`, `mediaType`, and legacy `imageUrl` for images.
  - `userId` (Key): **Long** — ID of the logged-in user.
- **Response**: Created `Post` object, or `400` with error message.

### Get Popular Posts
- **Endpoint**: `GET /api/posts/popular`
- **Response**: List of posts ordered by popularity (e.g. likes + comments).

---

## 3. Comments

### Get Comments for Post
- **Endpoint**: `GET /api/posts/{postId}/comments`
- **Response**: Array of `Comment` objects.

### Add Comment
- **Endpoint**: `POST /api/posts/{postId}/comments`
- **Query Param**: `userId={id}` (Long)
- **Content-Type**: `application/json` or plain text
- **Body**: Raw string — comment content (e.g. `"Great post!"`).
- **Response**: Created `Comment` object.

---

## 4. Likes

### Toggle Like
- **Endpoint**: `POST /api/posts/{postId}/like`
- **Query Param**: `userId={id}` (Long)
- **Response**: `200 OK` (toggles like on/off for that user and post).

---

## 5. User Profile

### Get Profile
- **Endpoint**: `GET /api/users/{id}`
- **Response**: Single `User` object, or `404` if not found.

### Get All Users
- **Endpoint**: `GET /api/users/userNames`
- **Response**: Array of `User` objects (full user list).

### Update Profile
- **Endpoint**: `PUT /api/users/{id}`
- **Content-Type**: `application/json`
- **Body**: `User` JSON (e.g. `fullName`, `bio`, `phoneNumber`, `twitterUrl`, `linkedinUrl`, `profileImageUrl`, `backgroundImageUrl`). Do not send password.
- **Response**: Updated `User` object.

### Upload Profile Image
- **Endpoint**: `PUT /api/users/{id}/profile-image`
- **Content-Type**: `multipart/form-data`
- **Payload**: `file` (Key) — image file.
- **Response**: Updated `User` object with `profileImageUrl` set (e.g. `/uploads/{fileName}`).

### Upload Background Image
- **Endpoint**: `PUT /api/users/{id}/background-image`
- **Content-Type**: `multipart/form-data`
- **Payload**: `file` (Key) — image file.
- **Response**: Updated `User` object with `backgroundImageUrl` set (e.g. `/uploads/{fileName}`).

---

## 6. Followers & Following

### Get Followers and Following Counts
- **Endpoint**: `GET /api/followersAndFollowing/{userId}/counts`
- **Response**:
  ```json
  {
    "followersCount": 10,
    "followingCount": 5
  }
  ```

### Get Followers List
- **Endpoint**: `GET /api/followersAndFollowing/{userId}/followers`
- **Response**: Array of `User` objects (users who follow `userId`).

### Get Following List
- **Endpoint**: `GET /api/followersAndFollowing/{userId}/following`
- **Response**: Array of `User` objects (users that `userId` follows).

### Follow User
- **Endpoint**: `POST /api/followersAndFollowing/follow`
- **Query Params**: `userId={id}` (follower), `followingUserId={id}` (user to follow).
- **Response**: `200 OK`. No-op if already following; error if user tries to follow themselves.

### Unfollow User
- **Endpoint**: `DELETE /api/followersAndFollowing/unfollow`
- **Query Params**: `userId={id}`, `followingUserId={id}`.
- **Response**: `200 OK`.

### Check Follow Status
- **Endpoint**: `GET /api/followersAndFollowing/check`
- **Query Params**: `userId={id}` (current user), `targetUserId={id}` (other user).
- **Response**:
  ```json
  {
    "isFollowing": true,
    "isFollowed": false
  }
  ```
  - `isFollowing`: current user follows target user.
  - `isFollowed`: target user follows current user.

---

## 7. Direct messages (Chat)

Instagram-style **user-to-user** DMs. The logged-in user is identified by `userId` (same pattern as likes and comments). After login, use the returned `User.id` as `userId`.

### Send a message
- **Endpoint**: `POST /api/chat/messages`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "senderId": 1,
    "receiverId": 2,
    "content": "Hey, how are you?"
  }
  ```
- **Response**: Created `ChatMessage` object (`id`, `sender`, `receiver`, `content`, `createdAt`, `readAt`).
- **Errors**: Cannot message yourself; empty content; missing sender/receiver.

### Get conversation thread (with one user)
- **Endpoint**: `GET /api/chat/messages`
- **Query params**: `userId` (current user), `otherUserId` (the person you are chatting with).
- **Response**: Array of `ChatMessage` objects, **oldest first** (full history between the two users).

### Inbox (all conversations)
- **Endpoint**: `GET /api/chat/conversations`
- **Query param**: `userId` (current user).
- **Response**: Array of `ConversationSummary` objects:
  - `otherUser` — the other participant (`User`).
  - `lastMessage` — latest message in that thread (`ChatMessage`).
  - `unreadCount` — messages from `otherUser` you have not read yet (where you are the receiver and `readAt` is null).
- Order: most recently active conversations first.

### Mark conversation as read
- **Endpoint**: `POST /api/chat/read`
- **Query params**: `userId` (reader), `otherUserId` (the other person in the chat).
- **Response**: `200 OK`. Marks all messages **from** `otherUserId` **to** `userId` as read (sets `readAt`). Call when the user opens the thread (like Instagram).

### Unread message count (badge)
- **Endpoint**: `GET /api/chat/unread-count`
- **Query param**: `userId`.
- **Response**:
  ```json
  { "unreadCount": 3 }
  ```
  Total DMs where this user is the receiver and the message is still unread.

### Kafka message delivery (backend)

Sending a message still goes through the **REST API** above. The backend then:

1. Persists the row in **MySQL** (source of truth for the UI).
2. After the database transaction **commits**, publishes a JSON event to the **Kafka** topic `chat.message.delivered` (key = message id).
3. A **consumer** in the same application reads that topic so you can later plug in push notifications, WebSocket fan-out to the receiver, or analytics.

Configure the broker in `application.properties`: `spring.kafka.bootstrap-servers` (default `localhost:9092`). For local development, run Kafka (for example Docker: `apache/kafka` or Confluent’s quick start) on that address. If the broker is unavailable, the HTTP response can still succeed while the Kafka publish is logged as an error—run Kafka for reliable delivery.

---

## 8. File / Uploads

### Serve Uploaded File
- **Endpoint**: `GET /uploads/{fileName}`
- **Example**: `GET /uploads/abc123.jpg` — serves the file (e.g. inline with appropriate `Content-Type`).
- **Response**: File bytes, or `404` if not found.

---

## 9. Server-rendered pages (optional)

These return HTML from the server (templates), not JSON:

- `GET /` — index
- `GET /login` — login page
- `GET /signup` — signup page

---

## Technical Notes for UI

- **CORS**: Enabled for all origins (`*`). You should not face CORS issues when calling APIs from the frontend.
- **Image URLs**: APIs may return paths like `/uploads/...`. Resolve them against the base URL (e.g. `http://localhost:8080/uploads/...`) or use the File endpoint above.
- **Token**: After login/register, the response includes a `token`. You can send it in headers (e.g. `Authorization: Bearer <token>`) if the backend adds auth middleware later; for now the doc uses `userId` in request params where needed.
