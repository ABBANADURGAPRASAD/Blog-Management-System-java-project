package com.blog.moderation;

/**
 * Copy to Blog_mng_api: com.blog.moderation.ModerationStatus
 * Add column on Post, Comment, User entities.
 */
public enum ModerationStatus {
    PENDING_MODERATION,
    APPROVED,
    WARNING,
    BLOCKED
}
