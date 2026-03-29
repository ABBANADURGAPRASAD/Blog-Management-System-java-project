package com.blog.service;

import com.blog.model.ChatMessage;
import com.blog.model.ConversationSummary;
import com.blog.model.SendMessageRequest;

import java.util.List;

public interface ChatService {

    ChatMessage sendMessage(SendMessageRequest request);

    List<ChatMessage> getThread(Long userId, Long otherUserId);

    List<ConversationSummary> getConversations(Long userId);

    void markConversationRead(Long userId, Long otherUserId);

    long getUnreadCount(Long userId);
}
