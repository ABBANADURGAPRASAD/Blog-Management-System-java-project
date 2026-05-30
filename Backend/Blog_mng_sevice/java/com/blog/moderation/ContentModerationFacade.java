package com.blog.moderation;

import com.blog.model.ModerationStatus;
import com.blog.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Unified moderation: local rules + optional Python AI (text, image CNN, video, OCR/RNN).
 */
@Component
public class ContentModerationFacade {

    private final CommentContentModerator localModerator;
    private final AiModerationClient aiModerationClient;
    private final UserRepository userRepository;

    public ContentModerationFacade(
            CommentContentModerator localModerator,
            AiModerationClient aiModerationClient,
            UserRepository userRepository) {
        this.localModerator = localModerator;
        this.aiModerationClient = aiModerationClient;
        this.userRepository = userRepository;
    }

    public CommentModerationDecision analyzeComment(String content, String userName) {
        return analyzeText("COMMENT", content, userName);
    }

    public CommentModerationDecision analyzeChat(String content, String userName) {
        return analyzeText("CHAT", content, userName);
    }

    public CommentModerationDecision analyzeAnonymousChat(String content) {
        return analyzeText("ANONYMOUS_CHAT", content, null);
    }

    public CommentModerationDecision analyzePostText(String title, String content, String tags, String userName) {
        return analyzeText("POST", combinedPostText(title, content, tags), userName);
    }

    public CommentModerationDecision analyzePostWithMedia(
            Long userId,
            String title,
            String content,
            String tags,
            MultipartFile file) {
        String userName = resolveUserName(userId);
        String fullText = combinedPostText(title, content, tags);

        CommentModerationDecision textDecision = analyzeText("POST", fullText, userName);
        if (textDecision.isBlocked()) {
            return textDecision;
        }

        if (file == null || file.isEmpty()) {
            return textDecision;
        }

        if (!aiModerationClient.isEnabled()) {
            return aiUnavailableDecision();
        }

        CommentModerationDecision media = aiModerationClient.analyzeMedia(
                "POST", file, fullText, userName);
        if (media == null) {
            return aiUnavailableDecision();
        }
        if (media.isBlocked()) {
            return media;
        }
        if (media.getStatus() == ModerationStatus.WARNING
                && textDecision.getStatus() == ModerationStatus.APPROVED) {
            return media;
        }
        return mergePostDecision(textDecision, media);
    }

    private CommentModerationDecision mergePostDecision(
            CommentModerationDecision textDecision,
            CommentModerationDecision mediaDecision) {
        if (textDecision.isBlocked() || mediaDecision.isBlocked()) {
            return textDecision.isBlocked() ? textDecision : mediaDecision;
        }
        if (textDecision.getStatus() == ModerationStatus.WARNING
                || mediaDecision.getStatus() == ModerationStatus.WARNING) {
            return textDecision.getConfidence() >= mediaDecision.getConfidence() ? textDecision : mediaDecision;
        }
        return textDecision.getConfidence() >= mediaDecision.getConfidence() ? textDecision : mediaDecision;
    }

    private static CommentModerationDecision aiUnavailableDecision() {
        return CommentModerationDecision.builder()
                .status(ModerationStatus.BLOCKED)
                .commentClass("BLOCKED")
                .confidence(1.0)
                .detectedLabels(List.of("AI_UNAVAILABLE"))
                .summary("AI safety service is required for media posts. Start Python AI on port 8090.")
                .build();
    }

    private CommentModerationDecision analyzeText(String contentType, String content, String userName) {
        CommentModerationDecision local = localModerator.analyze(content);
        CommentModerationDecision ai = aiModerationClient.analyzeText(contentType, content, userName);

        if (ai == null) {
            return local;
        }
        if (ai.isBlocked() || local.isBlocked()) {
            return ai.isBlocked() ? ai : local;
        }
        if (ai.getStatus() == ModerationStatus.WARNING
                || local.getStatus() == ModerationStatus.WARNING) {
            return ai.getConfidence() >= local.getConfidence() ? ai : local;
        }
        return ai.getConfidence() >= local.getConfidence() ? ai : local;
    }

    static String combinedPostText(String title, String content, String tags) {
        StringBuilder sb = new StringBuilder();
        if (title != null && !title.isBlank()) {
            sb.append(title.trim());
        }
        if (content != null && !content.isBlank()) {
            if (sb.length() > 0) {
                sb.append('\n');
            }
            sb.append(content.trim());
        }
        if (tags != null && !tags.isBlank()) {
            if (sb.length() > 0) {
                sb.append('\n');
            }
            sb.append(tags.trim());
        }
        return sb.toString();
    }

    private String resolveUserName(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId).map(u -> u.getUserName()).orElse(null);
    }
}
