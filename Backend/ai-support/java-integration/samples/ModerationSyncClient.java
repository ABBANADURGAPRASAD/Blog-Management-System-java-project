package com.blog.moderation;

import com.blog.moderation.ModerationStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

/**
 * Synchronous moderation for username / short bio at registration.
 * Calls Python POST /api/v1/moderate/sync
 */
@Component
public class ModerationSyncClient {

    private static final Logger log = LoggerFactory.getLogger(ModerationSyncClient.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${app.moderation.ai-service-token:}")
    private String serviceToken;

    public ModerationSyncClient(
            @Value("${app.moderation.ai-service-url:http://localhost:8090}") String baseUrl,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public ModerationStatus checkUsernameAndBio(String userName, String bio) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "contentType", "USER_PROFILE",
                    "text", bio != null ? bio : "",
                    "userName", userName != null ? userName : ""));

            String response = webClient
                    .post()
                    .uri("/api/v1/moderate/sync")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(3));

            JsonNode node = objectMapper.readTree(response);
            String status = node.path("finalStatus").asText("APPROVED");
            return ModerationStatus.valueOf(status);
        } catch (Exception e) {
            log.error("Sync moderation failed, defaulting to PENDING", e);
            return ModerationStatus.PENDING_MODERATION;
        }
    }
}
