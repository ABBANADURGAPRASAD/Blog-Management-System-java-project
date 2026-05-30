package com.blog.controller;

import com.blog.model.Post;
import com.blog.moderation.CommentModerationException;
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

            postService.validatePostContent(userId, post, file);

            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                String fileName = fileStorageService.storeFile(file);
                String fileUrl = "/uploads/" + fileName;

                String mediaType = resolveMediaType(contentType, fileName);
                if ("image".equals(mediaType)) {
                    post.setImageUrl(fileUrl);
                }

                post.setMediaUrl(fileUrl);
                post.setMediaType(mediaType);
            }
            return ResponseEntity.ok(postService.createPost(post, userId));
        } catch (CommentModerationException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing request: " + e.getMessage());
        }
    }

    @GetMapping("/popular")
    public List<Post> getPopularPosts() {
        return postService.getPopularPosts();
    }

    private static String resolveMediaType(String contentType, String storedFileName) {
        if (contentType != null) {
            if (contentType.startsWith("image/")) {
                return "image";
            }
            if (contentType.startsWith("video/")) {
                return "video";
            }
            if ("application/pdf".equals(contentType)) {
                return "pdf";
            }
        }
        if (com.blog.service.FileStorageService.isVideoExtension(storedFileName)) {
            return "video";
        }
        if (com.blog.service.FileStorageService.isImageExtension(storedFileName)) {
            return "image";
        }
        if (storedFileName != null && storedFileName.toLowerCase().endsWith(".pdf")) {
            return "pdf";
        }
        return "unknown";
    }
}
