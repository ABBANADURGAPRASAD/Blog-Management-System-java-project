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
    private final com.blog.service.FileStorageService fileStorageService;

    @Autowired
    public PostController(PostService postService, com.blog.service.FileStorageService fileStorageService) {
        this.postService = postService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public List<Post> getAllPosts(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "tagsTab", required = false, defaultValue = "false") boolean tagsTab) {
        if (userId != null) {
            if (tagsTab) {
                return postService.getPostsForTagsTab(userId);
            }
            return postService.getPostsByUserId(userId);
        }
        return postService.getAllPosts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return postService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createPost(
            @RequestPart("post") String postJson,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file,
            @RequestParam("userId") Long userId) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Post post = objectMapper.readValue(postJson, Post.class);
            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                // Store file and get filename
                String fileName = fileStorageService.storeFile(file);
                // Construct URL (assuming server runs on port 8080 or is fronted by proxy)
                // Better practice is to store just the relative path or use a helper to build
                // absolute URL
                // For now, storing relative path for serving via FileController
                String fileUrl = "/uploads/" + fileName;

                String mediaType = "unknown";
                if (contentType != null) {
                    if (contentType.startsWith("image")) {
                        mediaType = "image";
                        post.setImageUrl(fileUrl); // Keep legacy field populated
                    } else if (contentType.startsWith("video")) {
                        mediaType = "video";
                    } else if (contentType.equals("application/pdf")) {
                        mediaType = "pdf";
                    }
                }

                post.setMediaUrl(fileUrl);
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
