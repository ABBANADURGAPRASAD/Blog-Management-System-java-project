package com.blog.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;

    private String mediaUrl;

    private String mediaType; // "image", "video", "pdf"

    private String category;

    private String tags;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Like> likes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostMention> postMentions = new ArrayList<>();

    /**
     * Request-only: user ids @mentioned in post body. Not a DB column ({@link #postMentions} is persisted).
     * Lombok skips accessors for {@code @Transient} fields, so Jackson cannot bind JSON — use explicit getters/setters.
     */
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private List<Long> mentionedUserIds = new ArrayList<>();

    @Transient
    @JsonProperty("mentionedUserIds")
    public List<Long> getMentionedUserIds() {
        return mentionedUserIds != null ? mentionedUserIds : new ArrayList<>();
    }

    public void setMentionedUserIds(List<Long> mentionedUserIds) {
        this.mentionedUserIds = mentionedUserIds != null ? mentionedUserIds : new ArrayList<>();
    }

    @CreationTimestamp
    private LocalDateTime createdAt;
}
