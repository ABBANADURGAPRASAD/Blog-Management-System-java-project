package com.blog.controller;

import com.blog.model.User;
import com.blog.service.followersAndFollowingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/followersAndFollowing")
public class followersAndFollowingController {

    private final followersAndFollowingService followersAndFollowingService;

    @Autowired
    public followersAndFollowingController(followersAndFollowingService followersAndFollowingService) {
        this.followersAndFollowingService = followersAndFollowingService;
    }

    @GetMapping("/{userId}/counts")
    public ResponseEntity<Map<String, Long>> getCounts(@PathVariable Long userId) {
        long followersCount = followersAndFollowingService.getFollowersCount(userId);
        long followingCount = followersAndFollowingService.getFollowingCount(userId);
        return ResponseEntity.ok(Map.of(
                "followersCount", followersCount,
                "followingCount", followingCount
        ));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<User>> getFollowersList(@PathVariable Long userId) {
        return ResponseEntity.ok(followersAndFollowingService.getFollowersList(userId));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<List<User>> getFollowingList(@PathVariable Long userId) {
        return ResponseEntity.ok(followersAndFollowingService.getFollowingList(userId));
    }

    @PostMapping("/follow")
    public ResponseEntity<Void> followUser(@RequestParam Long userId, @RequestParam Long followingUserId) {
        followersAndFollowingService.followUser(userId, followingUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/unfollow")
    public ResponseEntity<Void> unfollowUser(@RequestParam Long userId, @RequestParam Long followingUserId) {
        followersAndFollowingService.unfollowUser(userId, followingUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkFollow(@RequestParam Long userId, @RequestParam Long targetUserId) {
        boolean isFollowing = followersAndFollowingService.isFollowing(userId, targetUserId);
        boolean isFollowed = followersAndFollowingService.isFollowed(userId, targetUserId);
        return ResponseEntity.ok(Map.of(
                "isFollowing", isFollowing,
                "isFollowed", isFollowed
        ));
    }
}
