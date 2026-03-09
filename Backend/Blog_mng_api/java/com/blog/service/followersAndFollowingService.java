package com.blog.service;

import com.blog.model.User;
import java.util.List;

public interface followersAndFollowingService {

    long getFollowersCount(Long userId);

    long getFollowingCount(Long userId);

    List<User> getFollowersList(Long userId);

    List<User> getFollowingList(Long userId);

    void followUser(Long userId, Long followingUserId);

    void unfollowUser(Long userId, Long followingUserId);

    boolean isFollowing(Long userId, Long followingUserId);

    boolean isFollowed(Long userId, Long followingUserId);
}
