package com.blog.repository;

import com.blog.model.CommentMention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CommentMentionRepository extends JpaRepository<CommentMention, Long> {

    @Query("SELECT cm FROM CommentMention cm JOIN FETCH cm.comment JOIN FETCH cm.mentionedUser "
            + "WHERE cm.comment.id IN :ids")
    List<CommentMention> findByComment_IdIn(@Param("ids") Collection<Long> ids);
}
