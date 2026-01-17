package com.blog.controller;

import com.blog.model.User;
import com.blog.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody LoginRequest loginRequest) {
        return userService.loginUser(loginRequest.getEmail(), loginRequest.getPassword())
                .map(user -> {
                    String token = userService.generateToken(user);
                    user.setToken(token);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.status(401).build());
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        User registeredUser = userService.registerUser(user);
        String token = userService.generateToken(registeredUser);
        registeredUser.setToken(token);
        return ResponseEntity.ok(registeredUser);
    }

    // Simple DTO for login
    @lombok.Data
    static class LoginRequest {
        private String email;
        private String password;
    }
}
