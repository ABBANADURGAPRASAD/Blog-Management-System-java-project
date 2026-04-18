package com.blog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "anonymous_match_queue", indexes = {
        @Index(name = "idx_anon_queue_ticket", columnList = "ticket_public_id", unique = true),
        @Index(name = "idx_anon_queue_user", columnList = "user_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnonymousMatchQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_public_id", nullable = false, unique = true, length = 36)
    private String ticketPublicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GenderPreference seeking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Gender myGender;

    /** Radius used when this ticket was enqueued (km). */
    private Double maxDistanceKm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_session_id")
    private AnonymousChatSession matchedSession;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
