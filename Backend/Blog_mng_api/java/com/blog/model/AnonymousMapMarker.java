package com.blog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Opaque map pin: clients see publicToken + lat/lng/color only — never user id.
 */
@Entity
@Table(name = "anonymous_map_markers", indexes = {
        @Index(name = "idx_anon_marker_public", columnList = "public_token", unique = true),
        @Index(name = "idx_anon_marker_user", columnList = "user_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnonymousMapMarker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_token", nullable = false, unique = true, length = 36)
    private String publicToken;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false, length = 16)
    private String colorHex;

    private LocalDateTime updatedAt;

    public static String newToken() {
        return UUID.randomUUID().toString();
    }
}
