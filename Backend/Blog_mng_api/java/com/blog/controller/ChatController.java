package com.blog.controller;

import com.blog.model.ChatMessage;
import com.blog.model.ConversationSummary;
import com.blog.model.SendMessageRequest;
import com.blog.model.UnreadCountResponse;
import com.blog.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    @Autowired
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest body) {
        try {
            return ResponseEntity.ok(chatService.sendMessage(body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> getThread(
            @RequestParam("userId") Long userId,
            @RequestParam("otherUserId") Long otherUserId) {
        return ResponseEntity.ok(chatService.getThread(userId, otherUserId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummary>> getConversations(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(chatService.getConversations(userId));
    }

    @PostMapping("/read")
    public ResponseEntity<Void> markRead(
            @RequestParam("userId") Long userId,
            @RequestParam("otherUserId") Long otherUserId) {
        chatService.markConversationRead(userId, otherUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(new UnreadCountResponse(chatService.getUnreadCount(userId)));
    }
}
