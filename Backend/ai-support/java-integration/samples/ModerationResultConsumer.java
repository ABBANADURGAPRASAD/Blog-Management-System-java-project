package com.blog.moderation.kafka;

import com.blog.moderation.ModerationContentType;
import com.blog.moderation.ModerationStatus;
import com.blog.moderation.event.ModerationCompletedEvent;
import com.blog.model.Comment;
import com.blog.model.Post;
import com.blog.model.User;
import com.blog.repository.CommentRepository;
import com.blog.repository.PostRepository;
import com.blog.repository.UserRepository;
import com.blog.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Applies AI moderation results to app entities and triggers notifications.
 */
@Component
@ConditionalOnProperty(name = "app.moderation.enabled", havingValue = "true")
public class ModerationResultConsumer {

    private static final Logger log = LoggerFactory.getLogger(ModerationResultConsumer.class);

    private final ObjectMapper objectMapper;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ModerationResultConsumer(
            ObjectMapper objectMapper,
            PostRepository postRepository,
            CommentRepository commentRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @KafkaListener(
            topics = "${app.kafka.moderation.completed-topic:moderation.completed}",
            groupId = "${app.kafka.moderation.consumer-group:blog-moderation-result-applier}")
    @Transactional
    public void onCompleted(
            @Payload String payload,
            @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        try {
            ModerationCompletedEvent event = objectMapper.readValue(payload, ModerationCompletedEvent.class);
            if (!"MODERATION_COMPLETED".equals(event.eventType())) {
                return;
            }
            ModerationStatus status = event.result().finalStatus();
            applyStatus(event.contentType(), event.contentId(), event.userId(), status);
            log.info("Applied moderation {} {} -> {}", event.contentType(), event.contentId(), status);
            // Extend NotificationService with notifyModerationOutcome(...)
            if (status == ModerationStatus.BLOCKED || status == ModerationStatus.WARNING) {
                log.warn("Moderation alert userId={} content={}:{}", event.userId(), event.contentType(), event.contentId());
            }
        } catch (Exception e) {
            log.error("Failed to apply moderation result key={}", key, e);
            throw new RuntimeException(e);
        }
    }

    private void applyStatus(ModerationContentType type, Long contentId, Long userId, ModerationStatus status) {
        switch (type) {
            case POST -> postRepository.findById(contentId).ifPresent(p -> {
                p.setModerationStatus(status);
                postRepository.save(p);
            });
            case COMMENT -> commentRepository.findById(contentId).ifPresent(c -> {
                c.setModerationStatus(status);
                commentRepository.save(c);
            });
            case USER_PROFILE, USER_BIO, USER_AVATAR, USER_MEDIA ->
                    userRepository.findById(contentId).ifPresent(u -> {
                        u.setModerationStatus(status);
                        userRepository.save(u);
                    });
            default -> log.debug("No entity mapper for {}", type);
        }
    }
}
