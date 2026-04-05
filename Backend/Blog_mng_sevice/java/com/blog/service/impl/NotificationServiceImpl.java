package com.blog.service.impl;

import com.blog.model.Notification;
import com.blog.model.NotificationDto;
import com.blog.model.NotificationType;
import com.blog.model.Post;
import com.blog.model.User;
import com.blog.model.followsAndFollowing;
import com.blog.repository.NotificationRepository;
import com.blog.repository.PostRepository;
import com.blog.repository.UserRepository;
import com.blog.repository.followersAndFollowingRepository;
import com.blog.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final int PREVIEW_MAX = 240;

    private final NotificationRepository notificationRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final followersAndFollowingRepository followersAndFollowingRepository;

    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository,
            PostRepository postRepository,
            UserRepository userRepository,
            followersAndFollowingRepository followersAndFollowingRepository) {
        this.notificationRepository = notificationRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.followersAndFollowingRepository = followersAndFollowingRepository;
    }

    @Override
    @Transactional
    public void notifyLike(Long actorUserId, Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null || post.getUser() == null) {
            return;
        }
        Long ownerId = post.getUser().getId();
        if (ownerId.equals(actorUserId)) {
            return;
        }
        User recipient = userRepository.findById(ownerId).orElse(null);
        User actor = userRepository.findById(actorUserId).orElse(null);
        if (recipient == null || actor == null) {
            return;
        }
        Notification n = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.LIKE)
                .post(post)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void notifyComment(Long actorUserId, Long postId, Long commentId, String content) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null || post.getUser() == null) {
            return;
        }
        Long ownerId = post.getUser().getId();
        if (ownerId.equals(actorUserId)) {
            return;
        }
        User recipient = userRepository.findById(ownerId).orElse(null);
        User actor = userRepository.findById(actorUserId).orElse(null);
        if (recipient == null || actor == null) {
            return;
        }
        String preview = truncatePreview(content);
        Notification n = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.COMMENT)
                .post(post)
                .relatedCommentId(commentId)
                .previewText(preview)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void notifyCommentMention(Long actorUserId, Long postId, Long commentId, Long mentionedUserId,
            String content) {
        if (mentionedUserId.equals(actorUserId)) {
            return;
        }
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return;
        }
        User recipient = userRepository.findById(mentionedUserId).orElse(null);
        User actor = userRepository.findById(actorUserId).orElse(null);
        if (recipient == null || actor == null) {
            return;
        }
        String preview = truncatePreview(content);
        Notification n = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.MENTION)
                .post(post)
                .relatedCommentId(commentId)
                .previewText(preview)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void notifyPostMention(Long actorUserId, Long postId, Long mentionedUserId, String content) {
        if (mentionedUserId.equals(actorUserId)) {
            return;
        }
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return;
        }
        User recipient = userRepository.findById(mentionedUserId).orElse(null);
        User actor = userRepository.findById(actorUserId).orElse(null);
        if (recipient == null || actor == null) {
            return;
        }
        String preview = truncatePreview(content);
        Notification n = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.MENTION)
                .post(post)
                .previewText(preview)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void notifyNewPost(Long authorUserId, Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return;
        }
        User author = userRepository.findById(authorUserId).orElse(null);
        if (author == null) {
            return;
        }
        List<followsAndFollowing> followRows = followersAndFollowingRepository.findByFollowingUser(authorUserId);
        if (followRows.isEmpty()) {
            return;
        }
        List<Notification> batch = new ArrayList<>();
        for (followsAndFollowing row : followRows) {
            User follower = row.getUser();
            if (follower == null || follower.getId().equals(authorUserId)) {
                continue;
            }
            batch.add(Notification.builder()
                    .recipient(follower)
                    .actor(author)
                    .type(NotificationType.NEW_POST)
                    .post(post)
                    .isRead(false)
                    .build());
        }
        if (!batch.isEmpty()) {
            notificationRepository.saveAll(batch);
        }
    }

    @Override
    @Transactional
    public void notifyFollow(Long followerUserId, Long followedUserId) {
        if (followerUserId.equals(followedUserId)) {
            return;
        }
        User recipient = userRepository.findById(followedUserId).orElse(null);
        User actor = userRepository.findById(followerUserId).orElse(null);
        if (recipient == null || actor == null) {
            return;
        }
        Notification n = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.FOLLOW)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Long recipientUserId, Pageable pageable) {
        return notificationRepository
                .findByRecipient_IdOrderByCreatedAtDesc(recipientUserId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long recipientUserId) {
        return notificationRepository.countByRecipient_IdAndIsReadFalse(recipientUserId);
    }

    @Override
    @Transactional
    public void markAsRead(Long recipientUserId, Long notificationId) {
        notificationRepository.findByIdAndRecipient_Id(notificationId, recipientUserId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long recipientUserId) {
        notificationRepository.markAllAsReadForRecipient(recipientUserId);
    }

    private static String truncatePreview(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }
        String t = content.trim();
        if (t.length() <= PREVIEW_MAX) {
            return t;
        }
        return t.substring(0, PREVIEW_MAX) + "…";
    }

    private NotificationDto toDto(Notification n) {
        NotificationDto.NotificationDtoBuilder b = NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .createdAt(n.getCreatedAt())
                .read(n.isRead())
                .commentId(n.getRelatedCommentId())
                .previewText(n.getPreviewText());
        User actor = n.getActor();
        if (actor != null) {
            b.actorId(actor.getId())
                    .actorUserName(actor.getUserName())
                    .actorFullName(actor.getFullName())
                    .actorProfileImageUrl(actor.getProfileImageUrl());
        }
        Post post = n.getPost();
        if (post != null) {
            b.postId(post.getId()).postTitle(post.getTitle());
        }
        return b.build();
    }
}
