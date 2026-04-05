package com.blog.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post_mentions", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "post_id", "mentioned_user_id" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "posts", "passwordHash", "password",
            "token" })
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentioned_user_id", nullable = false)
    private User mentionedUser;
}
