package com.blog.event;

import com.blog.model.ChatMessage;

import java.time.LocalDateTime;

/**
 * Published after a chat message is persisted. Used to emit to Kafka after transaction commit.
 */
public class ChatMessageDeliveredEvent {

    private final Long messageId;
    private final Long senderId;
    private final Long receiverId;
    private final String content;
    private final LocalDateTime createdAt;

    public ChatMessageDeliveredEvent(Long messageId, Long senderId, Long receiverId, String content,
            LocalDateTime createdAt) {
        this.messageId = messageId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.createdAt = createdAt;
    }

    public static ChatMessageDeliveredEvent from(ChatMessage message) {
        return new ChatMessageDeliveredEvent(
                message.getId(),
                message.getSender().getId(),
                message.getReceiver().getId(),
                message.getContent(),
                message.getCreatedAt());
    }

    public Long getMessageId() {
        return messageId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
