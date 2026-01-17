# Blog Management System - Backend

This project is a multi-module Spring Boot application for managing a blog system.

## Project Structure

- **Blog_mng_app**: Main application entry point (`BlogApplication`).
- **Blog_mng_api**: REST Controllers (`com.blog.controller`).
- **Blog_mng_sevice**: Business Logic, Entities, Repositories (`com.blog.service`, `com.blog.model`, `com.blog.repository`).

## Database Schema (DDL)

Run the following SQL script to set up your MySQL database (`blog_db`).

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS blog_db;
USE blog_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    bio VARCHAR(255),
    phone_number VARCHAR(255),
    twitter_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    profile_image_url VARCHAR(255)
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url VARCHAR(255),
    category VARCHAR(255),
    tags VARCHAR(255),
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

## Popular Post Logic (SQL)

The popularity of a post is calculated based on the sum of unique likes and comments.

```sql
SELECT p.id, p.title, 
       COUNT(DISTINCT l.id) AS like_count, 
       COUNT(DISTINCT c.id) AS comment_count
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id
ORDER BY (like_count + comment_count) DESC;
```

## How to Run

1.  **Build the Project:**
    Open a terminal in the root directory (`Backend`) and run:
    ```bash
    mvn clean install
    ```

2.  **Run the Application:**
    Navigate to the App module and run:
    ```bash
    cd Blog_mng_app
    mvn spring-boot:run
    ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
    - **Body**: `{ "fullName": "John Doe", "email": "john@example.com", "password": "password123" }`
- `POST /api/auth/login` - Login user
    - **Body**: `{ "email": "john@example.com", "password": "password123" }`

### Users
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile details
    - **Body**: `{ "fullName": "...", "bio": "...", "phoneNumber": "...", "twitterUrl": "...", "linkedinUrl": "..." }`
- `PUT /api/users/{id}/profile-image` - Upload/Update Profile Image
    - **Form-Data**: `file` (Image)
- `PUT /api/users/{id}/background-image` - Upload/Update Background Image
    - **Form-Data**: `file` (Image)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/{id}` - Get specific post
- `GET /api/posts/popular` - Get popular posts (sorted by likes + comments)
- `POST /api/posts` - Create a new post (Supports Files)
    - **Header**: `Content-Type: multipart/form-data`
    - **Part `post` (JSON)**: `{ "title": "My Post", "content": "Content...", "category": "Tech", "tags": "java,spring", "user": { "id": 1 } }`
    - **Part `file` (File)**: Image, Video, or PDF file (Optional)

### Comments
- `GET /api/posts/{postId}/comments` - Get comments for a post
- `POST /api/posts/{postId}/comments` - Add a comment
    - **Body**: `{ "content": "Nice post!", "user": { "id": 1 } }`

### Likes
- `POST /api/posts/{postId}/like` - Like/Unlike a post
    - **Body**: `{ "user": { "id": 1 } }`

### File Serving
- `GET /uploads/{filename}` - Serve uploaded files (images, videos, pdfs)

