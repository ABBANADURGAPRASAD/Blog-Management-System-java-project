# Backend API Guide for UI Developers

**Base URL**: `http://localhost:8080`

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
    "bio": "Java Developer",
    "phoneNumber": "1234567890",
    "twitterUrl": "http://twitter.com/john",
    "linkedinUrl": "http://linkedin.com/in/john",
    "profileImageUrl": "http://example.com/image.jpg"
  }
  ```
- **Response**: Returns the created `User` object (including ID).

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
- **Response**: Returns simple `User` object if successful.
- **Note**: Currently no JWT/Session token is generated. You should store the returned `id` to use in subsequent requests (e.g., creating posts).

---

## 2. Posts

### Get All Posts
- **Endpoint**: `GET /api/posts`
- **Response**: Array of `Post` objects.

### Get Post Details
- **Endpoint**: `GET /api/posts/{id}`
- **Response**: Single `Post` object.

### Create Post (Important)
- **Endpoint**: `POST /api/posts`
- **Content-Type**: `multipart/form-data`
- **Payload**:
  - `post` (Key): **JSON String** with `Content-Type: application/json`.
    ```json
    {
      "title": "My New Blog Post",
      "content": "This is the content...",
      "category": "Tech",
      "tags": "java, spring"
    }
    ```
  - `image` (Key): **File** (Optional image upload).
  - `userId` (Key): **Long** (ID of the logged-in user).

### Get Popular Posts
- **Endpoint**: `GET /api/posts/popular`
- **Response**: List of posts ordered by popularity (likes + comments).

---

## 3. Comments

### Get Comments for Post
- **Endpoint**: `GET /api/posts/{postId}/comments`

### Add Comment
- **Endpoint**: `POST /api/posts/{postId}/comments`
- **Query Param**: `userId={id}`
- **Body**: Raw String (Content of the comment) OR Plain Text.
  - *Check Controller*: It accepts `@RequestBody String content`.

---

## 4. Likes

### Toggle Like
- **Endpoint**: `POST /api/posts/{postId}/like`
- **Query Param**: `userId={id}`
- **Response**: `200 OK` (Toggles between like/unlike).

---

## 5. User Profile

### Get Profile
- **Endpoint**: `GET /api/users/{id}`

### Update Profile
- **Endpoint**: `PUT /api/users/{id}`
- **Body**: `User` JSON object.

---

## Technical Notes for UI
- **CORS**: Enabled for all origins (`*`). You should not face CORS issues.
- **Image URLs**: Currently returning local paths like `/uploads/...`. You may need to handle this or mock it in the UI until cloud storage is connected.
