package com.blog.repository;

import com.blog.model.followsAndFollowing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface followersAndFollowingRepository extends JpaRepository<followsAndFollowing, Long> {

    long countByFollowingUser(Long followingUserId);

    long countByUser_Id(Long userId);

    List<followsAndFollowing> findByFollowingUser(Long followingUserId);

    List<followsAndFollowing> findByUser_Id(Long userId);

    Optional<followsAndFollowing> findByUser_IdAndFollowingUser(Long userId, Long followingUserId);

    void deleteByUser_IdAndFollowingUser(Long userId, Long followingUserId);
}
