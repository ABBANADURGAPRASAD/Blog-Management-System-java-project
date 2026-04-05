package com.blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP endpoint for anonymous chat fan-out. Clients subscribe to {@code /topic/anonymous/{sessionPublicId}}.
 * Session ids are UUIDs (hard to enumerate). For production, pass JWT on STOMP CONNECT and validate server-side.
 */
@Configuration
@EnableWebSocketMessageBroker
public class AnonymousWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/anonymous")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
