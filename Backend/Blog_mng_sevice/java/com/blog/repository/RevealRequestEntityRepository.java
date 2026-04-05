package com.blog.repository;

import com.blog.model.AnonymousChatSession;
import com.blog.model.RevealRequestEntity;
import com.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RevealRequestEntityRepository extends JpaRepository<RevealRequestEntity, Long> {

    Optional<RevealRequestEntity> findBySessionAndFromUser(AnonymousChatSession session, User fromUser);
}
