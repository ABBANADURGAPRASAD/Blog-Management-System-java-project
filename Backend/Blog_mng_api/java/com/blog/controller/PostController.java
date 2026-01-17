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
    public ResponseEntity<?> createPost(@RequestPart("post") String postJson,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file,
            @RequestParam Long userId) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Post post = objectMapper.readValue(postJson, Post.class);
            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                // Save file logic here (e.g., to disk or cloud storage)

                String mediaType = "unknown";
                if (contentType != null) {
                    if (contentType.startsWith("image")) {
                        mediaType = "image";
                        post.setImageUrl("/uploads/" + fileName); // Keep legacy field populated
                    } else if (contentType.startsWith("video")) {
                        mediaType = "video";
                    } else if (contentType.equals("application/pdf")) {
                        mediaType = "pdf";
                    }
                }

                post.setMediaUrl("/uploads/" + fileName);
                post.setMediaType(mediaType);
            }
            return ResponseEntity.ok(postService.createPost(post, userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing request: " + e.getMessage());
        }
    }

    @GetMapping("/popular")
    public List<Post> getPopularPosts() {
        return postService.getPopularPosts();
    }
}
