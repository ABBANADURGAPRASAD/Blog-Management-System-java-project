package com.blog.controller;

import com.blog.model.dto.*;
import com.blog.service.AnonymousChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Anonymous map + random chat. Privacy: map markers never expose user ids; chat uses opaque session UUIDs.
 * Always use HTTPS in production; rate-limit at gateway; do not log message bodies.
 */
@RestController
@RequestMapping("/api/anonymous")
public class AnonymousChatController {

    private final AnonymousChatService anonymousChatService;

    @Autowired
    public AnonymousChatController(AnonymousChatService anonymousChatService) {
        this.anonymousChatService = anonymousChatService;
    }

    @PutMapping("/map/presence")
    public ResponseEntity<Void> mapPresence(@RequestParam Long userId, @RequestBody MapPresenceRequest body) {
        try {
            anonymousChatService.updateMapPresence(userId, body);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/map/presence")
    public ResponseEntity<Void> clearPresence(@RequestParam Long userId) {
        anonymousChatService.clearMapPresence(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/map/markers")
    public List<MapMarkerResponse> markers(
            @RequestParam double minLat,
            @RequestParam double maxLat,
            @RequestParam double minLng,
            @RequestParam double maxLng) {
        return anonymousChatService.listMarkers(minLat, maxLat, minLng, maxLng);
    }

    @PostMapping("/map/chat")
    public ResponseEntity<?> startMapChat(@RequestParam Long userId, @RequestBody MapChatStartRequest body) {
        try {
            return ResponseEntity.ok(anonymousChatService.startMapChat(userId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/random/join")
    public ResponseEntity<?> randomJoin(@RequestParam Long userId, @RequestBody RandomMatchRequest body) {
        try {
            return ResponseEntity.ok(anonymousChatService.joinRandomQueue(userId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/random/poll")
    public ResponseEntity<?> randomPoll(@RequestParam Long userId, @RequestParam String ticketId) {
        try {
            return ResponseEntity.ok(anonymousChatService.pollRandomQueue(userId, ticketId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/session/{sessionPublicId}")
    public ResponseEntity<?> getSession(@RequestParam Long userId, @PathVariable String sessionPublicId) {
        try {
            return ResponseEntity.ok(anonymousChatService.getSession(userId, sessionPublicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/session/{sessionPublicId}/messages")
    public ResponseEntity<?> messages(@RequestParam Long userId, @PathVariable String sessionPublicId) {
        try {
            return ResponseEntity.ok(anonymousChatService.listMessages(userId, sessionPublicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/session/{sessionPublicId}/messages")
    public ResponseEntity<?> send(
            @RequestParam Long userId,
            @PathVariable String sessionPublicId,
            @RequestBody SendAnonymousMessageRequest body) {
        try {
            return ResponseEntity.ok(anonymousChatService.sendMessage(userId, sessionPublicId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/session/{sessionPublicId}/reveal/request")
    public ResponseEntity<?> revealRequest(@RequestParam Long userId, @PathVariable String sessionPublicId) {
        try {
            anonymousChatService.requestReveal(userId, sessionPublicId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/session/{sessionPublicId}/reveal/respond")
    public ResponseEntity<?> revealRespond(
            @RequestParam Long userId,
            @PathVariable String sessionPublicId,
            @RequestParam boolean accept) {
        try {
            anonymousChatService.respondReveal(userId, sessionPublicId, accept);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/session/{sessionPublicId}/end")
    public ResponseEntity<?> end(@RequestParam Long userId, @PathVariable String sessionPublicId) {
        try {
            anonymousChatService.endSession(userId, sessionPublicId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
