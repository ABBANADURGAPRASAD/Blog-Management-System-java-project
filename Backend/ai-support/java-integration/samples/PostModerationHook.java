package com.blog.moderation;

import com.blog.model.Post;
import com.blog.service.impl.PostServiceImpl;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * EXAMPLE — integrate into PostServiceImpl.createPost after postRepository.save():
 *
 * <pre>
 * Post saved = postRepository.save(post);
 * if (moderationOrchestrator != null) {
 *     moderationOrchestrator.submitPost(saved, mentionIds);
 * }
 * </pre>
 *
 * Before save, set: post.setModerationStatus(ModerationStatus.PENDING_MODERATION);
 */
@Component
public class PostModerationHook {

    private final ModerationOrchestrator orchestrator;

    public PostModerationHook(ModerationOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    public Post afterPostSaved(Post saved, List<Long> mentionIds) {
        orchestrator.submitPost(saved, mentionIds);
        return saved;
    }
}
