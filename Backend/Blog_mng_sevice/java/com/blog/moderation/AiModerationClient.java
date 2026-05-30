package com.blog.moderation;

import com.blog.model.ModerationStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Calls Python AI service for text sync and multipart media moderation.
 */
@Component
public class AiModerationClient {

    private static final Logger log = LoggerFactory.getLogger(AiModerationClient.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.moderation.ai-service-url:http://localhost:8090}")
    private String baseUrl;

    @Value("${app.moderation.ai-service-token:dev-moderation-token}")
    private String serviceToken;

    @Value("${app.moderation.ai-timeout-seconds:45}")
    private int timeoutSeconds;

    @Value("${app.moderation.use-ai-service:true}")
    private boolean useAiService;

    public AiModerationClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isEnabled() {
        return useAiService && baseUrl != null && !baseUrl.isBlank();
    }

    public CommentModerationDecision analyzeText(String contentType, String text, String userName) {
        if (!isEnabled()) {
            return null;
        }
        try {
            String body = objectMapper.writeValueAsString(java.util.Map.of(
                    "content_type", contentType,
                    "text", text != null ? text : "",
                    "user_name", userName != null ? userName : ""));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/v1/moderate/sync"))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Authorization", "Bearer " + serviceToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("AI sync moderation HTTP {}", response.statusCode());
                return null;
            }
            return mapResult(response.body());
        } catch (Exception e) {
            log.warn("AI text moderation unavailable: {}", e.getMessage());
            return null;
        }
    }

    public CommentModerationDecision analyzeMedia(
            String contentType,
            MultipartFile file,
            String text,
            String userName) {
        if (!isEnabled() || file == null || file.isEmpty()) {
            return null;
        }
        try {
            String boundary = "----BlogModeration" + UUID.randomUUID();
            byte[] body = buildMultipart(boundary, contentType, text, userName, file);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/v1/moderate/media"))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Authorization", "Bearer " + serviceToken)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("AI media moderation HTTP {}", response.statusCode());
                return null;
            }
            return mapResult(response.body());
        } catch (Exception e) {
            log.warn("AI media moderation unavailable: {}", e.getMessage());
            return null;
        }
    }

    private byte[] buildMultipart(
            String boundary,
            String contentType,
            String text,
            String userName,
            MultipartFile file) throws Exception {
        String crlf = "\r\n";
        var sb = new StringBuilder();
        sb.append("--").append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"content_type\"").append(crlf).append(crlf);
        sb.append(contentType).append(crlf);

        if (text != null) {
            sb.append("--").append(boundary).append(crlf);
            sb.append("Content-Disposition: form-data; name=\"text\"").append(crlf).append(crlf);
            sb.append(text).append(crlf);
        }
        if (userName != null) {
            sb.append("--").append(boundary).append(crlf);
            sb.append("Content-Disposition: form-data; name=\"user_name\"").append(crlf).append(crlf);
            sb.append(userName).append(crlf);
        }

        String mime = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.bin";
        sb.append("--").append(boundary).append(crlf);
        sb.append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                .append(filename.replace("\"", ""))
                .append("\"")
                .append(crlf);
        sb.append("Content-Type: ").append(mime).append(crlf).append(crlf);

        byte[] header = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] fileBytes = file.getBytes();
        byte[] footer = (crlf + "--" + boundary + "--" + crlf).getBytes(StandardCharsets.UTF_8);

        byte[] full = new byte[header.length + fileBytes.length + footer.length];
        System.arraycopy(header, 0, full, 0, header.length);
        System.arraycopy(fileBytes, 0, full, header.length, fileBytes.length);
        System.arraycopy(footer, 0, full, header.length + fileBytes.length, footer.length);
        return full;
    }

    private CommentModerationDecision mapResult(String json) throws Exception {
        JsonNode node = objectMapper.readTree(json);
        String statusStr = node.path("final_status").asText(node.path("finalStatus").asText("APPROVED"));
        ModerationStatus status = ModerationStatus.valueOf(statusStr);

        String commentClass = "SAFE";
        if (node.has("comment_class")) {
            commentClass = node.get("comment_class").asText();
        } else if (node.has("commentClass")) {
            commentClass = node.get("commentClass").asText();
        } else if (status == ModerationStatus.BLOCKED) {
            commentClass = "BLOCKED";
        } else if (status == ModerationStatus.WARNING) {
            commentClass = "WARNING";
        }

        double confidence = node.path("confidence").asDouble(0.0);
        List<String> labels = new ArrayList<>();
        for (JsonNode s : node.path("scores")) {
            String label = s.path("label").asText();
            if (!label.isEmpty()) {
                labels.add(label);
            }
        }

        String summary = status == ModerationStatus.BLOCKED
                ? "Content blocked by AI safety policy."
                : status == ModerationStatus.WARNING
                        ? "Content flagged for review."
                        : "OK";

        return CommentModerationDecision.builder()
                .status(status)
                .commentClass(commentClass)
                .confidence(confidence)
                .detectedLabels(labels)
                .summary(summary)
                .build();
    }
}
