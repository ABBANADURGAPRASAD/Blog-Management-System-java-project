package com.blog.model;

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

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();

    @Transient // Not saved to DB, serves as input from JSON
    private String password;
}
