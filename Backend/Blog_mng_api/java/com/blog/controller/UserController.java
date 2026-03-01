package com.blog.controller;

import com.blog.model.User;
import com.blog.service.UserService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    private final com.blog.service.FileStorageService fileStorageService;

    @Autowired
    public UserController(UserService userService, com.blog.service.FileStorageService fileStorageService) {
        this.userService = userService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserProfile(@PathVariable Long id) {
        return userService.getUserProfile(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/userNames")
    public List<String> getUserList() {
        return userService.getAllUsers();
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUserProfile(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUserProfile(id, user));
    }

    @PutMapping(value = "/{id}/profile-image", consumes = "multipart/form-data")
    public ResponseEntity<User> uploadProfileImage(@PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = "/uploads/" + fileName;
        return ResponseEntity.ok(userService.updateProfileImage(id, fileUrl));
    }

    @PutMapping(value = "/{id}/background-image", consumes = "multipart/form-data")
    public ResponseEntity<User> uploadBackgroundImage(@PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = "/uploads/" + fileName;
        return ResponseEntity.ok(userService.updateBackgroundImage(id, fileUrl));
    }
}
