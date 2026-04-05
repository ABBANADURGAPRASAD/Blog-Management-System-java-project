package com.blog.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    private String bio;

    private String phoneNumber;

    private String twitterUrl;

    private String linkedinUrl;

    private String profileImageUrl;

    private String backgroundImageUrl;

    /** Unique handle; JSON may use "userName" or "username". */
    @Column(nullable = false, unique = true)
    @JsonProperty("userName")
    @JsonAlias({ "username", "user_name" })
    private String userName;

    /** Used for anonymous matchmaking; optional. */
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Gender gender;

    /** Hex color for map pins, e.g. #4A90E2 */
    @Column(length = 16)
    private String favoriteColor;

    /** Last position shared for map finder / random match (user consent). */
    private Double mapLatitude;

    private Double mapLongitude;

    /** When true, user appears on anonymous world map (Finder). */
    @Builder.Default
    private Boolean mapVisible = Boolean.FALSE;

    @Transient
    private String token;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();

    @Transient // Not saved to DB, serves as input from JSON
    private String password;
}
