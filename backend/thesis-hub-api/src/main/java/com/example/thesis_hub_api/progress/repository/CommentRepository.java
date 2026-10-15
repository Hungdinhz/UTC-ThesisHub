package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTaskIdAndParentIsNullOrderByCreatedAtAsc(Long taskId);

    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);

    List<Comment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
}
