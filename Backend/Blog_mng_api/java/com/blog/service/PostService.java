package com.blog.service;

import com.blog.model.Post;
import java.util.List;
import java.util.Optional;

public interface PostService {
    Post createPost(Post post, Long userId);

    List<Post> getAllPosts();

    List<Post> getPostsByUserId(Long userId);

    /** Posts authored by user with at least one @mention, or posts where user was @mentioned. */
    List<Post> getPostsForTagsTab(Long userId);

    Optional<Post> getPostById(Long id);

    List<Post> getPopularPosts();
}
