package com.blog.moderation.event;

import com.blog.moderation.ModerationContentType;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Kafka message: moderation.requested
 * JSON field names match contracts/moderation-event.schema.json
 */
public record ModerationRequestedEvent(
        String eventType,
        UUID requestId,
        String idempotencyKey,
        ModerationContentType contentType,
        Long contentId,
        Long userId,
        int priority,
        Instant timestamp,
        String traceId,
        Payload payload) {

    public static ModerationRequestedEvent of(
            UUID requestId,
            String idempotencyKey,
            ModerationContentType contentType,
            Long contentId,
            Long userId,
            Payload payload) {
        return new ModerationRequestedEvent(
                "MODERATION_REQUESTED",
                requestId,
                idempotencyKey,
                contentType,
                contentId,
                userId,
                5,
                Instant.now(),
                null,
                payload);
    }

    public record Payload(
            String title,
            String text,
            List<String> hashtags,
            List<Long> mentionedUserIds,
            List<MediaRef> media,
            String userName,
            String fullName,
            String bio) {
    }

    public record MediaRef(String url, String mediaType, boolean presigned) {
    }
}
