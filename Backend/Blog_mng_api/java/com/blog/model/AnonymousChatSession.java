package com.blog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "anonymous_chat_sessions", indexes = {
        @Index(name = "idx_anon_session_public_id", columnList = "public_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnonymousChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Opaque id for clients (never sequential DB id). */
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_a_id", nullable = false)
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_b_id", nullable = false)
    private User userB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AnonymousSessionMode mode;

    @Column(nullable = false)
    @Builder.Default
    private boolean revealed = false;

    private LocalDateTime endedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AnonymousChatMessage> messages = new ArrayList<>();

    public static String newPublicId() {
        return UUID.randomUUID().toString();
    }
}
