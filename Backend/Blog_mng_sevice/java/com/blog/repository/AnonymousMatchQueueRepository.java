package com.blog.repository;

import com.blog.model.AnonymousMatchQueue;
import com.blog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnonymousMatchQueueRepository extends JpaRepository<AnonymousMatchQueue, Long> {

    Optional<AnonymousMatchQueue> findByTicketPublicId(String ticketPublicId);

    Optional<AnonymousMatchQueue> findByUser(User user);

    Optional<AnonymousMatchQueue> findByUser_Id(Long userId);

    void deleteByUser_Id(Long userId);

    @Query("SELECT q FROM AnonymousMatchQueue q WHERE q.matchedSession IS NULL AND q.user.id <> :excludeUserId")
    List<AnonymousMatchQueue> findAllWaitingExcept(@Param("excludeUserId") Long excludeUserId);
}
