package com.blog.repository;

import com.blog.model.AnonymousChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnonymousChatSessionRepository extends JpaRepository<AnonymousChatSession, Long> {

    Optional<AnonymousChatSession> findByPublicId(String publicId);
}
