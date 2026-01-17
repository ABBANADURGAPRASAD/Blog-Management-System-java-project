package com.blog.controller;

import com.blog.model.Post;
import com.blog.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    @Autowired
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public List<Post> getAllPosts() {
        return postService.getAllPosts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return postService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public Post createPost(@RequestPart("post") Post post,
            @RequestPart(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            @RequestParam Long userId) {
        if (image != null && !image.isEmpty()) {
            // Simplified logic: In production, save to S3/Cloudinary and get URL
            // For now, setting a mock URL or usage logic
            String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
            // In a real app: fileStorageService.store(image, fileName);
            post.setImageUrl("/uploads/" + fileName);
        }
        return postService.createPost(post, userId);
    }

    @GetMapping("/popular")
    public List<Post> getPopularPosts() {
        return postService.getPopularPosts();
    }
}
