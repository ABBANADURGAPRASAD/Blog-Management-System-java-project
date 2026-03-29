package com.blog.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;

@Configuration
@EnableKafka
public class ChatKafkaConfig {

    @Bean
    public NewTopic chatMessageTopic(@Value("${app.kafka.chat-topic}") String topic) {
        return new NewTopic(topic, 3, (short) 1);
    }
}
