package com.blog.service;

public interface LikeService {
    void toggleLike(Long postId, Long userId);

    long getLikeCount(Long postId);
}
