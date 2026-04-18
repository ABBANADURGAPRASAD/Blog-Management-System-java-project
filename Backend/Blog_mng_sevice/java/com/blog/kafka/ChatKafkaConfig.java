package com.blog.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableKafka
@EnableAsync
public class ChatKafkaConfig {

    /**
     * Publishes chat delivery events off the HTTP thread so a slow/unavailable broker
     * does not hold servlet threads or trigger Hikari leak detection during Kafka metadata waits.
     */
    @Bean(name = "chatKafkaTaskExecutor")
    public ThreadPoolTaskExecutor chatKafkaTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(1_000);
        executor.setThreadNamePrefix("chat-kafka-");
        executor.initialize();
        return executor;
    }

    @Bean
    @ConditionalOnProperty(name = "app.kafka.create-topic", havingValue = "true")
    public NewTopic chatMessageTopic(@Value("${app.kafka.chat-topic}") String topic) {
        return new NewTopic(topic, 3, (short) 1);
    }
}
