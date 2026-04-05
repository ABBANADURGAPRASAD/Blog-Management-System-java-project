package com.blog.repository;

import com.blog.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUser_Id(Long userId);

    @Query("SELECT DISTINCT p FROM Post p WHERE "
            + "(p.user.id = :userId AND EXISTS (SELECT 1 FROM PostMention m WHERE m.post.id = p.id)) OR "
            + "EXISTS (SELECT 1 FROM PostMention m2 WHERE m2.post.id = p.id AND m2.mentionedUser.id = :userId)")
    List<Post> findPostsForTagsTab(@Param("userId") Long userId);

    @Query("SELECT p FROM Post p " +
            "LEFT JOIN p.likes l " +
            "LEFT JOIN p.comments c " +
            "GROUP BY p.id " +
            "ORDER BY (COUNT(DISTINCT l.id) + COUNT(DISTINCT c.id)) DESC")
    List<Post> findPopularPosts();
}
