package com.blog.repository;

import com.blog.model.PostMention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMentionRepository extends JpaRepository<PostMention, Long> {

    void deleteByPost_Id(Long postId);

    List<PostMention> findByPost_Id(Long postId);
}
