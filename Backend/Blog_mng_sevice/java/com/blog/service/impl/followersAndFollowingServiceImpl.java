package com.blog.service.impl;

import com.blog.model.User;
import com.blog.model.followsAndFollowing;
import com.blog.repository.UserRepository;
import com.blog.repository.followersAndFollowingRepository;
import com.blog.service.followersAndFollowingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class followersAndFollowingServiceImpl implements followersAndFollowingService {

    private final followersAndFollowingRepository followersAndFollowingRepository;
    private final UserRepository userRepository;

    @Autowired
    public followersAndFollowingServiceImpl(followersAndFollowingRepository followersAndFollowingRepository,
                                            UserRepository userRepository) {
        this.followersAndFollowingRepository = followersAndFollowingRepository;
        this.userRepository = userRepository;
    }

    @Override
    public long getFollowersCount(Long userId) {
        return followersAndFollowingRepository.countByFollowingUser(userId);
    }

    @Override
    public long getFollowingCount(Long userId) {
        return followersAndFollowingRepository.countByUser_Id(userId);
    }

    @Override
    public List<User> getFollowersList(Long userId) {
        return followersAndFollowingRepository.findByFollowingUser(userId)
                .stream()
                .map(followsAndFollowing::getUser)
                .toList();
    }

    @Override
    public List<User> getFollowingList(Long userId) {
        List<Long> followingIds = followersAndFollowingRepository.findByUser_Id(userId)
                .stream()
                .map(followsAndFollowing::getFollowingUser)
                .toList();
        return userRepository.findAllById(followingIds);
    }

    @Override
    @Transactional
    public void followUser(Long userId, Long followingUserId) {
        if (userId.equals(followingUserId)) {
            throw new IllegalArgumentException("User cannot follow themselves");
        }
        if (followersAndFollowingRepository.findByUser_IdAndFollowingUser(userId, followingUserId).isPresent()) {
            return;
        }
        User follower = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        followsAndFollowing follow = followsAndFollowing.builder()
                .user(follower)
                .followingUser(followingUserId)
                .followedUser(followingUserId)
                .build();
        followersAndFollowingRepository.save(follow);
    }

    @Override
    @Transactional
    public void unfollowUser(Long userId, Long followingUserId) {
        followersAndFollowingRepository.deleteByUser_IdAndFollowingUser(userId, followingUserId);
    }

    @Override
    public boolean isFollowing(Long userId, Long followingUserId) {
        return followersAndFollowingRepository.findByUser_IdAndFollowingUser(userId, followingUserId).isPresent();
    }

    @Override
    public boolean isFollowed(Long userId, Long followingUserId) {
        return followersAndFollowingRepository.findByUser_IdAndFollowingUser(followingUserId, userId).isPresent();
    }
}
