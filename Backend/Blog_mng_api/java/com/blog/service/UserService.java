package com.blog.service;

import com.blog.model.User;
import java.util.Optional;

public interface UserService {
    User registerUser(User user);

    Optional<User> loginUser(String email, String password);

    Optional<User> getUserProfile(Long userId);

    User updateUserProfile(Long userId, User userDetails);
}
