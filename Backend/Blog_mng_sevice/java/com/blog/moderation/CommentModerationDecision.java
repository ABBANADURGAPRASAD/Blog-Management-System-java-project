package com.blog.moderation;

import com.blog.model.ModerationStatus;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CommentModerationDecision {
    ModerationStatus status;
    String commentClass; // SAFE, WARNING, BLOCKED
    double confidence;
    List<String> detectedLabels;
    String summary;

    public boolean isBlocked() {
        return status == ModerationStatus.BLOCKED;
    }

    public boolean requiresEmail() {
        return status == ModerationStatus.WARNING || status == ModerationStatus.BLOCKED;
    }
}
