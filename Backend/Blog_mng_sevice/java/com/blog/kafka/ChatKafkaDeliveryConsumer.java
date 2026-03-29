package com.blog.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Consumes delivered chat events from Kafka. Extend here for push notifications, WebSocket fan-out, etc.
 */
@Component
public class ChatKafkaDeliveryConsumer {

    private static final Logger log = LoggerFactory.getLogger(ChatKafkaDeliveryConsumer.class);

    @KafkaListener(topics = "${app.kafka.chat-topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void onChatMessageDelivered(
            @Payload String payload,
            @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.debug("Kafka chat delivery: key={} payload={}", key, payload);
        // Hook: notify receiver via WebSocket, FCM, or email digest
    }
}
