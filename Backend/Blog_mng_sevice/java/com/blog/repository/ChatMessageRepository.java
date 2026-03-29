package com.blog.repository;

import com.blog.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m LEFT JOIN FETCH m.sender LEFT JOIN FETCH m.receiver WHERE (m.sender.id = :u1 AND m.receiver.id = :u2) OR (m.sender.id = :u2 AND m.receiver.id = :u1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversationBetween(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT m FROM ChatMessage m LEFT JOIN FETCH m.sender LEFT JOIN FETCH m.receiver WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.createdAt DESC")
    List<ChatMessage> findAllMessagesForUserOrdered(@Param("userId") Long userId);

    long countByReceiver_IdAndSender_IdAndReadAtIsNull(Long receiverId, Long senderId);

    long countByReceiver_IdAndReadAtIsNull(Long receiverId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ChatMessage m SET m.readAt = :readAt WHERE m.sender.id = :otherUserId AND m.receiver.id = :userId AND m.readAt IS NULL")
    int markMessagesAsReadFromSender(@Param("userId") Long userId, @Param("otherUserId") Long otherUserId,
            @Param("readAt") LocalDateTime readAt);
}
