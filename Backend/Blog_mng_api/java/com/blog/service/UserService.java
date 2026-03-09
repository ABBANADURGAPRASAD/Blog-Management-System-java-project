package com.blog.service;

import com.blog.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    User registerUser(User user);

    Optional<User> loginUser(String email, String password);

    Optional<User> getUserProfile(Long userId);

    User updateUserProfile(Long userId, User userDetails);

    User updateProfileImage(Long userId, String imageUrl);

    User updateBackgroundImage(Long userId, String imageUrl);

    List<User> getAllUsers();
    
    String generateToken(User user);

    boolean validateToken(String token);
}
