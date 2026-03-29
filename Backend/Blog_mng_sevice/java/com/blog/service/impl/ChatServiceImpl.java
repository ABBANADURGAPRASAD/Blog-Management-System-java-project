package com.blog.service.impl;

import com.blog.event.ChatMessageDeliveredEvent;
import com.blog.model.ChatMessage;
import com.blog.model.ConversationSummary;
import com.blog.model.SendMessageRequest;
import com.blog.model.User;
import com.blog.repository.ChatMessageRepository;
import com.blog.repository.UserRepository;
import com.blog.service.ChatService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ChatServiceImpl(
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public ChatMessage sendMessage(SendMessageRequest request) {
        if (request.getSenderId() == null || request.getReceiverId() == null) {
            throw new IllegalArgumentException("senderId and receiverId are required");
        }
        if (Objects.equals(request.getSenderId(), request.getReceiverId())) {
            throw new IllegalArgumentException("Cannot message yourself");
        }
        String content = request.getContent();
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content is required");
        }

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content.trim())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        eventPublisher.publishEvent(ChatMessageDeliveredEvent.from(saved));
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessage> getThread(Long userId, Long otherUserId) {
        if (userId == null || otherUserId == null) {
            return List.of();
        }
        return chatMessageRepository.findConversationBetween(userId, otherUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationSummary> getConversations(Long userId) {
        if (userId == null) {
            return List.of();
        }
        List<ChatMessage> all = chatMessageRepository.findAllMessagesForUserOrdered(userId);
        Map<Long, ChatMessage> latestByOther = new LinkedHashMap<>();
        for (ChatMessage m : all) {
            User other = otherParticipant(userId, m);
            if (other == null || other.getId() == null) {
                continue;
            }
            latestByOther.putIfAbsent(other.getId(), m);
        }

        List<ConversationSummary> out = new ArrayList<>();
        for (Map.Entry<Long, ChatMessage> e : latestByOther.entrySet()) {
            ChatMessage last = e.getValue();
            User other = otherParticipant(userId, last);
            long unread = chatMessageRepository.countByReceiver_IdAndSender_IdAndReadAtIsNull(userId,
                    other.getId());
            out.add(ConversationSummary.builder()
                    .otherUser(other)
                    .lastMessage(last)
                    .unreadCount(unread)
                    .build());
        }
        return out;
    }

    private static User otherParticipant(Long me, ChatMessage m) {
        if (m.getSender() != null && me.equals(m.getSender().getId())) {
            return m.getReceiver();
        }
        return m.getSender();
    }

    @Override
    @Transactional
    public void markConversationRead(Long userId, Long otherUserId) {
        if (userId == null || otherUserId == null) {
            return;
        }
        chatMessageRepository.markMessagesAsReadFromSender(userId, otherUserId, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (userId == null) {
            return 0L;
        }
        return chatMessageRepository.countByReceiver_IdAndReadAtIsNull(userId);
    }
}
