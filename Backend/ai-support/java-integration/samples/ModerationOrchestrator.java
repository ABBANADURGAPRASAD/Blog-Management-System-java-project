package com.blog.moderation;

import com.blog.moderation.event.ModerationRequestedEvent;
import com.blog.moderation.kafka.ModerationKafkaProducer;
import com.blog.model.Comment;
import com.blog.model.Post;
import com.blog.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Central entry point: build event, set PENDING on entity, publish Kafka.
 * Persist moderation_requests via JPA repository (implement ModerationRequestRepository).
 */
@Service
public class ModerationOrchestrator {

    private final ModerationKafkaProducer kafkaProducer;

    @Value("${app.moderation.enabled:false}")
    private boolean enabled;

    public ModerationOrchestrator(ModerationKafkaProducer kafkaProducer) {
        this.kafkaProducer = kafkaProducer;
    }

    public void submitPost(Post post, List<Long> mentionIds) {
        if (!enabled) {
            return;
        }
        UUID requestId = UUID.randomUUID();
        String idempotencyKey = "POST:" + post.getId() + ":" + System.currentTimeMillis();

        post.setModerationStatus(ModerationStatus.PENDING_MODERATION);
        post.setModerationRequestId(requestId);

        List<ModerationRequestedEvent.MediaRef> media = new ArrayList<>();
        if (post.getImageUrl() != null) {
            media.add(new ModerationRequestedEvent.MediaRef(post.getImageUrl(), "image", false));
        }
        if (post.getMediaUrl() != null) {
            media.add(new ModerationRequestedEvent.MediaRef(
                    post.getMediaUrl(),
                    post.getMediaType() != null ? post.getMediaType() : "image",
                    false));
        }

        List<String> hashtags = post.getTags() != null
                ? Arrays.stream(post.getTags().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList())
                : List.of();

        ModerationRequestedEvent.Payload payload = new ModerationRequestedEvent.Payload(
                post.getTitle(),
                post.getContent(),
                hashtags,
                mentionIds != null ? mentionIds : List.of(),
                media,
                null,
                null,
                null);

        ModerationRequestedEvent event = ModerationRequestedEvent.of(
                requestId,
                idempotencyKey,
                ModerationContentType.POST,
                post.getId(),
                post.getUser().getId(),
                payload);

        kafkaProducer.publish(event);
    }

    public void submitComment(Comment comment) {
        if (!enabled) {
            return;
        }
        UUID requestId = UUID.randomUUID();
        String idempotencyKey = "COMMENT:" + comment.getId();

        comment.setModerationStatus(ModerationStatus.PENDING_MODERATION);
        comment.setModerationRequestId(requestId);

        ModerationRequestedEvent.Payload payload = new ModerationRequestedEvent.Payload(
                null,
                comment.getContent(),
                List.of(),
                List.of(),
                List.of(),
                null,
                null,
                null);

        ModerationRequestedEvent event = ModerationRequestedEvent.of(
                requestId,
                idempotencyKey,
                ModerationContentType.COMMENT,
                comment.getId(),
                comment.getUser().getId(),
                payload);

        kafkaProducer.publish(event);
    }

    public void submitUserProfile(User user, ModerationContentType type) {
        if (!enabled) {
            return;
        }
        UUID requestId = UUID.randomUUID();
        String idempotencyKey = type.name() + ":" + user.getId() + ":" + System.currentTimeMillis();

        user.setModerationStatus(ModerationStatus.PENDING_MODERATION);
        user.setModerationRequestId(requestId);

        List<ModerationRequestedEvent.MediaRef> media = new ArrayList<>();
        if (user.getProfileImageUrl() != null && type == ModerationContentType.USER_AVATAR) {
            media.add(new ModerationRequestedEvent.MediaRef(user.getProfileImageUrl(), "image", false));
        }

        ModerationRequestedEvent.Payload payload = new ModerationRequestedEvent.Payload(
                null,
                user.getBio(),
                List.of(),
                List.of(),
                media,
                user.getUserName(),
                user.getFullName(),
                user.getBio());

        ModerationRequestedEvent event = ModerationRequestedEvent.of(
                requestId,
                idempotencyKey,
                type,
                user.getId(),
                user.getId(),
                payload);

        kafkaProducer.publish(event);
    }
}
