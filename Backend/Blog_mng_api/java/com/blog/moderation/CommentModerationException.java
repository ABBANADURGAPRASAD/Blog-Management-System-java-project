package com.blog.moderation;

import com.blog.model.ModerationStatus;
import lombok.Getter;

import java.util.List;

@Getter
public class CommentModerationException extends RuntimeException {

    private final ModerationStatus status;
    private final List<String> detectedLabels;

    public CommentModerationException(String message, ModerationStatus status, List<String> detectedLabels) {
        super(message);
        this.status = status;
        this.detectedLabels = detectedLabels != null ? detectedLabels : List.of();
    }
}
