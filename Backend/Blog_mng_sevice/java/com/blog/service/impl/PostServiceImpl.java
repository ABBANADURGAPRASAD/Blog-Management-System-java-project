package com.blog.service.impl;

import com.blog.model.Post;
import com.blog.model.PostMention;
import com.blog.model.User;
import com.blog.repository.PostMentionRepository;
import com.blog.repository.PostRepository;
import com.blog.repository.UserRepository;
import com.blog.moderation.CommentModerationDecision;
import com.blog.moderation.CommentModerationException;
import com.blog.moderation.ContentModerationFacade;
import com.blog.model.ModerationStatus;
import com.blog.service.NotificationService;
import com.blog.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostMentionRepository postMentionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ContentModerationFacade contentModerationFacade;

    @Autowired
    public PostServiceImpl(PostRepository postRepository,
            PostMentionRepository postMentionRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            ContentModerationFacade contentModerationFacade) {
        this.postRepository = postRepository;
        this.postMentionRepository = postMentionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.contentModerationFacade = contentModerationFacade;
    }

    @Override
    public void validatePostContent(Long userId, Post post, MultipartFile mediaFile) {
        CommentModerationDecision moderation = contentModerationFacade.analyzePostWithMedia(
                userId,
                post.getTitle(),
                post.getContent(),
                post.getTags(),
                mediaFile);
        if (moderation.isBlocked()
                || moderation.getStatus() == ModerationStatus.WARNING) {
            throw new CommentModerationException(
                    "Your post was not published because it violates our community guidelines "
                            + "(unsafe text or media detected).",
                    ModerationStatus.BLOCKED,
                    moderation.getDetectedLabels());
        }
    }

    @Override
    @Transactional
    public Post createPost(Post post, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Long> mentionIds = post.getMentionedUserIds() != null
                ? new ArrayList<>(new LinkedHashSet<>(post.getMentionedUserIds()))
                : new ArrayList<>();
        post.setUser(user);
        post.setPostMentions(new ArrayList<>());
        post.setMentionedUserIds(null);
        Post saved = postRepository.save(post);

        for (Long mid : mentionIds) {
            if (mid == null) {
                continue;
            }
            userRepository.findById(mid).ifPresent(mentioned -> {
                PostMention pm = PostMention.builder()
                        .post(saved)
                        .mentionedUser(mentioned)
                        .build();
                postMentionRepository.save(pm);
                if (!mid.equals(userId)) {
                    notificationService.notifyPostMention(userId, saved.getId(), mid,
                            saved.getContent() != null ? saved.getContent() : "");
                }
            });
        }

        notificationService.notifyNewPost(userId, saved.getId());
        saved.setMentionedUserIds(mentionIds);
        return saved;
    }

    @Override
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    @Override
    public List<Post> getPostsByUserId(Long userId) {
        return postRepository.findByUser_Id(userId);
    }

    @Override
    public List<Post> getPostsForTagsTab(Long userId) {
        return postRepository.findPostsForTagsTab(userId);
    }

    @Override
    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    @Override
    public List<Post> getPopularPosts() {
        return postRepository.findPopularPosts();
    }
}
