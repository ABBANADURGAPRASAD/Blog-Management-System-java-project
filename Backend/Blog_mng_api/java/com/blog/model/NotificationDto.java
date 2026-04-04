package com.blog.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * API shape for the notifications list (avoids exposing internal entity graph).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {

    private Long id;
    private NotificationType type;
    private LocalDateTime createdAt;
    private boolean read;
    private Long postId;
    private String postTitle;
    private Long commentId;
    private String previewText;
    private Long actorId;
    private String actorUserName;
    private String actorFullName;
    private String actorProfileImageUrl;
}
