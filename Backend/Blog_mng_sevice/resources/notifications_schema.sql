-- Optional manual DDL for MySQL (otherwise Hibernate spring.jpa.hibernate.ddl-auto=update creates this table).
-- Aligns with com.blog.model.Notification

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    post_id BIGINT NULL,
    related_comment_id BIGINT NULL,
    preview_text VARCHAR(500) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id),
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id),
    CONSTRAINT fk_notifications_post FOREIGN KEY (post_id) REFERENCES posts (id)
);

CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at);
CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, is_read);
