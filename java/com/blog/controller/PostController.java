package com.blog.controller;

import com.blog.model.Post;
import com.blog.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    @Autowired
    private PostService postService;

    @PostMapping("/create")
    public Post createPost(@RequestParam("content") String content, @RequestParam("media") MultipartFile mediaFile) throws IOException {
        return postService.createPost(content, mediaFile);
    }

    @GetMapping("/user/{userId}")
    public List<Post> getUserPosts(@PathVariable Long userId) {
        return postService.getUserPosts(userId);
    }
}
