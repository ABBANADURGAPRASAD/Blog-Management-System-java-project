package com.blog.moderation.event;

import com.blog.moderation.ModerationContentType;
import com.blog.moderation.ModerationStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Kafka message: moderation.completed
 */
public record ModerationCompletedEvent(
        String eventType,
        UUID requestId,
        String idempotencyKey,
        ModerationContentType contentType,
        Long contentId,
        Long userId,
        Instant timestamp,
        String traceId,
        Result result) {

    public record Result(
            ModerationStatus finalStatus,
            String commentClass,
            double confidence,
            boolean needsHumanReview,
            String detectedLanguage,
            boolean degradedMode,
            int processingMs,
            List<ScoreEntry> scores) {
    }

    public record ScoreEntry(String label, double score, String model, String language) {
    }
}
