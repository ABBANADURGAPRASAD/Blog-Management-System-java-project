# Blog Management System - Backend

This project is a multi-module Spring Boot application for managing a blog system.

## Project Structure

- **Blog_mng_app**: Main application entry point (`BlogApplication`).
- **Blog_mng_api**: REST Controllers (`com.blog.controller`).
- **Blog_mng_sevice**: Business Logic, Entities, Repositories (`com.blog.service`, `com.blog.model`, `com.blog.repository`).

## Database Schema (DDL)

```sql
CREATE TABLE users (
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

CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url VARCHAR(255),
    category VARCHAR(255),
    tags VARCHAR(255),
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE TABLE likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
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

## API Summary

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`
- **Users**: `GET /api/users/{id}`, `PUT /api/users/{id}`
- **Posts**: 
    - `GET /api/posts` (List all)
    - `GET /api/posts/{id}` (Details)
    - `POST /api/posts` (Create - Multipart)
    - `GET /api/posts/popular` (Popular Posts)
- **Comments**: `GET/POST /api/posts/{postId}/comments`
- **Likes**: `POST /api/posts/{postId}/like`
