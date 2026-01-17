package com.blog.service;

import com.blog.model.Comment;
import java.util.List;

public interface CommentService {
    Comment addComment(Long postId, Long userId, String content);

    List<Comment> getCommentsForPost(Long postId);
}
