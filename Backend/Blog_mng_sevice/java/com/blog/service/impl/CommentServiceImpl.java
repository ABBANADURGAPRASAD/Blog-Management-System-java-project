package com.blog.service.impl;

import com.blog.model.Comment;
import com.blog.model.CommentMention;
import com.blog.model.Post;
import com.blog.model.User;
import com.blog.repository.CommentMentionRepository;
import com.blog.repository.CommentRepository;
import com.blog.repository.PostRepository;
import com.blog.repository.UserRepository;
import com.blog.service.CommentService;
import com.blog.service.NotificationService;
import com.blog.util.MentionParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentMentionRepository commentMentionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public CommentServiceImpl(CommentRepository commentRepository,
            CommentMentionRepository commentMentionRepository,
            PostRepository postRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.commentMentionRepository = commentMentionRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public Comment addComment(Long postId, Long userId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = Comment.builder()
                .content(content)
                .post(post)
                .user(user)
                .build();
        Comment saved = commentRepository.save(comment);
        notificationService.notifyComment(userId, postId, saved.getId(), content);

        Long postOwnerId = post.getUser().getId();
        List<String> tokens = MentionParser.parseUsernames(content);
        LinkedHashSet<Long> seenMentionIds = new LinkedHashSet<>();
        List<String> resolvedNames = new ArrayList<>();

        for (String token : tokens) {
            userRepository.findByUserNameIgnoreCase(token).ifPresent(mentioned -> {
                if (!seenMentionIds.add(mentioned.getId())) {
                    return;
                }
                CommentMention cm = CommentMention.builder()
                        .comment(saved)
                        .mentionedUser(mentioned)
                        .build();
                commentMentionRepository.save(cm);
                resolvedNames.add(mentioned.getUserName());

                boolean skipNotify = mentioned.getId().equals(userId)
                        || mentioned.getId().equals(postOwnerId);
                if (!skipNotify) {
                    notificationService.notifyCommentMention(userId, postId, saved.getId(), mentioned.getId(), content);
                }
            });
        }

        saved.setMentionedUsernames(resolvedNames);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Comment> getCommentsForPost(Long postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
        if (comments.isEmpty()) {
            return comments;
        }
        List<Long> ids = comments.stream().map(Comment::getId).toList();
        List<CommentMention> mentionRows = commentMentionRepository.findByComment_IdIn(ids);
        Map<Long, List<String>> byComment = new HashMap<>();
        for (CommentMention row : mentionRows) {
            Long cid = row.getComment().getId();
            String uname = row.getMentionedUser().getUserName();
            byComment.computeIfAbsent(cid, k -> new ArrayList<>()).add(uname);
        }
        for (Comment c : comments) {
            c.setMentionedUsernames(byComment.getOrDefault(c.getId(), List.of()));
        }
        return comments;
    }
}
