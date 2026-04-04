package com.blog.service;

import com.blog.model.NotificationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    void notifyLike(Long actorUserId, Long postId);

    void notifyComment(Long actorUserId, Long postId, Long commentId, String content);

    /** Notifies a user @mentioned in a comment (post author only receives the regular comment notification). */
    void notifyCommentMention(Long actorUserId, Long postId, Long commentId, Long mentionedUserId, String content);

    void notifyNewPost(Long authorUserId, Long postId);

    void notifyFollow(Long followerUserId, Long followedUserId);

    Page<NotificationDto> getNotifications(Long recipientUserId, Pageable pageable);

    long getUnreadCount(Long recipientUserId);

    void markAsRead(Long recipientUserId, Long notificationId);

    void markAllAsRead(Long recipientUserId);
}
