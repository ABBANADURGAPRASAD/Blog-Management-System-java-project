package com.blog.controller;

import com.blog.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/like")
public class LikeController {

    private final LikeService likeService;

    @Autowired
    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping
    public ResponseEntity<Void> toggleLike(@PathVariable Long postId, @RequestParam Long userId) {
        likeService.toggleLike(postId, userId);
        return ResponseEntity.ok().build();
    }
}
