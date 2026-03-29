package com.blog.kafka;

import com.blog.event.ChatMessageDeliveredEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Publishes to Kafka only after the DB transaction commits, so the message is durable before delivery.
 */
@Component
public class ChatKafkaDeliveryBridge {

    private static final Logger log = LoggerFactory.getLogger(ChatKafkaDeliveryBridge.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.chat-topic}")
    private String chatTopic;

    public ChatKafkaDeliveryBridge(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishAfterCommit(ChatMessageDeliveredEvent event) {
        try {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("messageId", event.getMessageId());
            node.put("senderId", event.getSenderId());
            node.put("receiverId", event.getReceiverId());
            node.put("content", event.getContent());
            node.put("createdAt", event.getCreatedAt().toString());
            String json = objectMapper.writeValueAsString(node);
            kafkaTemplate.send(chatTopic, String.valueOf(event.getMessageId()), json);
        } catch (Exception e) {
            log.error("Failed to publish chat message {} to Kafka; message is saved in DB", event.getMessageId(), e);
        }
    }
}
