package com.blog.service;

import com.blog.model.Post;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface PostService {

    /** AI + rule-based safety check before persisting post media (image/video). */
    void validatePostContent(Long userId, Post post, MultipartFile mediaFile);

    Post createPost(Post post, Long userId);

    List<Post> getAllPosts();

    List<Post> getPostsByUserId(Long userId);

    /** Posts authored by user with at least one @mention, or posts where user was @mentioned. */
    List<Post> getPostsForTagsTab(Long userId);

    Optional<Post> getPostById(Long id);

    List<Post> getPopularPosts();
}
