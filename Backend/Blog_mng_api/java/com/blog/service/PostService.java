package com.blog.service;

import com.blog.model.Post;
import java.util.List;
import java.util.Optional;

public interface PostService {
    Post createPost(Post post, Long userId);

    List<Post> getAllPosts();

    Optional<Post> getPostById(Long id);

    List<Post> getPopularPosts();
}
