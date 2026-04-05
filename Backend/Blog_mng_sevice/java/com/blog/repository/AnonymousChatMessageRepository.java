package com.blog.repository;

import com.blog.model.AnonymousChatMessage;
import com.blog.model.AnonymousChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnonymousChatMessageRepository extends JpaRepository<AnonymousChatMessage, Long> {

    List<AnonymousChatMessage> findBySessionOrderByCreatedAtAsc(AnonymousChatSession session);
}
