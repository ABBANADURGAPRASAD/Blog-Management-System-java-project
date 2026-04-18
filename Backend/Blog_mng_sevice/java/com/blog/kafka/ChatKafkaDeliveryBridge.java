package com.blog.kafka;

import com.blog.event.ChatMessageDeliveredEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Publishes to Kafka only after the DB transaction commits, so the message is durable before delivery.
 * Runs asynchronously so Kafka metadata / broker delays do not block the HTTP thread or pool connections.
 */
@Component
public class ChatKafkaDeliveryBridge {

    private static final Logger log = LoggerFactory.getLogger(ChatKafkaDeliveryBridge.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.chat-topic}")
    private String chatTopic;

    @Value("${app.kafka.publish-enabled:true}")
    private boolean publishEnabled;

    public ChatKafkaDeliveryBridge(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Async("chatKafkaTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishAfterCommit(ChatMessageDeliveredEvent event) {
        if (!publishEnabled) {
            return;
        }
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("messageId", event.getMessageId());
            node.put("senderId", event.getSenderId());
            node.put("receiverId", event.getReceiverId());
            node.put("content", event.getContent());
            node.put("createdAt", event.getCreatedAt().toString());
            String json = objectMapper.writeValueAsString(node);
            kafkaTemplate.send(chatTopic, String.valueOf(event.getMessageId()), json).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish chat message {} to Kafka; message is saved in DB",
                            event.getMessageId(), ex);
                }
            });
        } catch (Exception e) {
            log.error("Failed to serialize or dispatch chat message {} to Kafka", event.getMessageId(), e);
        }
    }
}
