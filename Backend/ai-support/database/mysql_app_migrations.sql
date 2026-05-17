-- MySQL migrations for main blog_db (run alongside PostgreSQL moderation_db)
USE blog_db;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS moderation_request_id CHAR(36) NULL;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS moderation_request_id CHAR(36) NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS moderation_request_id CHAR(36) NULL;

-- MySQL 8.0.12+ may not support IF NOT EXISTS on ADD COLUMN; use Flyway/Liquibase in production.
CREATE INDEX idx_posts_moderation_status ON posts (moderation_status);
CREATE INDEX idx_comments_moderation_status ON comments (moderation_status);
