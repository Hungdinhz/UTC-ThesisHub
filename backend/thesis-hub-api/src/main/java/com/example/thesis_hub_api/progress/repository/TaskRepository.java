package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByThesisId(Long thesisId);

    List<Task> findByAssignedToId(Long assignedToId);

    List<Task> findByCreatedById(Long createdById);

    List<Task> findByThesisIdAndStatus(Long thesisId, String status);

    long countByThesisId(Long thesisId);

    long countByThesisIdAndStatus(Long thesisId, String status);

    @Query("SELECT t FROM Task t WHERE " +
           "(:thesisId IS NULL OR t.thesis.id = :thesisId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assignedToId IS NULL OR t.assignedTo.id = :assignedToId) " +
           "ORDER BY t.dueDate ASC NULLS LAST")
    Page<Task> searchTasks(
            @Param("thesisId") Long thesisId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("assignedToId") Long assignedToId,
            Pageable pageable);
}
