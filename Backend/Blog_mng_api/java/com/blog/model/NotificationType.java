package com.blog.model;

/**
 * Activity types stored for the notifications feed (similar to Instagram activity).
 */
public enum NotificationType {
    /** Someone liked the recipient's post */
    LIKE,
    /** Someone commented on the recipient's post */
    COMMENT,
    /** Someone @mentioned the recipient in a comment */
    MENTION,
    /** Someone the recipient follows published a new post */
    NEW_POST,
    /** Someone started following the recipient */
    FOLLOW
}
