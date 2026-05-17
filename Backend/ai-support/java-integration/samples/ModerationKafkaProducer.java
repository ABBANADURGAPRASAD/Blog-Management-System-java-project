package com.blog.moderation.kafka;

import com.blog.moderation.event.ModerationRequestedEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Publishes moderation requests asynchronously (same pattern as ChatKafkaDeliveryBridge).
 */
@Component
public class ModerationKafkaProducer {

    private static final Logger log = LoggerFactory.getLogger(ModerationKafkaProducer.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.moderation.request-topic:moderation.requested}")
    private String requestTopic;

    @Value("${app.moderation.publish-enabled:true}")
    private boolean publishEnabled;

    public ModerationKafkaProducer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Async("chatKafkaTaskExecutor")
    public void publish(ModerationRequestedEvent event) {
        if (!publishEnabled) {
            log.debug("Moderation publish disabled, skipping requestId={}", event.requestId());
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(event);
            String key = event.contentType().name() + ":" + event.contentId();
            kafkaTemplate.send(requestTopic, key, json).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish moderation request {}", event.requestId(), ex);
                    // TODO: insert into moderation_outbox for retry
                }
            });
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize moderation event {}", event.requestId(), e);
        }
    }
}
