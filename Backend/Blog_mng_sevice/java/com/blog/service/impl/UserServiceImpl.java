package com.blog.service.impl;

import com.blog.model.User;
import com.blog.repository.UserRepository;
import com.blog.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already in use");
        }
        // Simple "hashing" for now as per requirements
        if (user.getPassword() != null) {
            user.setPasswordHash(user.getPassword());
        }
        return userRepository.save(user);
    }

    @Override
    public Optional<User> loginUser(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getPasswordHash().equals(password)) {
            return user;
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> getUserProfile(Long userId) {
        return userRepository.findById(userId);
    }

    @Override
    public User updateUserProfile(Long userId, User userDetails) {
        return userRepository.findById(userId).map(user -> {
            user.setFullName(userDetails.getFullName());
            user.setBio(userDetails.getBio());
            user.setPhoneNumber(userDetails.getPhoneNumber());
            user.setTwitterUrl(userDetails.getTwitterUrl());
            user.setLinkedinUrl(userDetails.getLinkedinUrl());
            user.setProfileImageUrl(userDetails.getProfileImageUrl());
            user.setBackgroundImageUrl(userDetails.getBackgroundImageUrl());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User updateProfileImage(Long userId, String imageUrl) {
        return userRepository.findById(userId).map(user -> {
            user.setProfileImageUrl(imageUrl);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User updateBackgroundImage(Long userId, String imageUrl) {
        return userRepository.findById(userId).map(user -> {
            user.setBackgroundImageUrl(imageUrl);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private final java.util.Map<String, User> activeTokens = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public String generateToken(User user) {
        String token = java.util.UUID.randomUUID().toString();
        activeTokens.put(token, user);
        return token;
    }

    @Override
    public boolean validateToken(String token) {
        return activeTokens.containsKey(token);
    }
}
