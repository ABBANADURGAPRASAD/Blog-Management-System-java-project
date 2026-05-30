package com.blog.repository;

import com.blog.model.AnonymousChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnonymousChatSessionRepository extends JpaRepository<AnonymousChatSession, Long> {

    Optional<AnonymousChatSession> findByPublicId(String publicId);

    @Query("""
            SELECT s FROM AnonymousChatSession s
            LEFT JOIN FETCH s.userA
            LEFT JOIN FETCH s.userB
            WHERE s.endedAt IS NULL
            AND (s.userA.id = :userId OR s.userB.id = :userId)
            ORDER BY s.createdAt DESC
            """)
    List<AnonymousChatSession> findActiveSessionsForUser(@Param("userId") Long userId);
}
