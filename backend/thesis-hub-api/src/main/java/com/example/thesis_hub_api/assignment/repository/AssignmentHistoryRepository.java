package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.AssignmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentHistoryRepository extends JpaRepository<AssignmentHistory, Integer> {
    List<AssignmentHistory> findByProjectRoundIdOrderByCreatedAtDesc(Integer projectRoundId);
}
