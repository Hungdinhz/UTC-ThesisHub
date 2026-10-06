package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByThesisId(Long thesisId);
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByStatus(String status);
}
