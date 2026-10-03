package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupervisorAssignmentRepository extends JpaRepository<SupervisorAssignment, Integer> {
    List<SupervisorAssignment> findByProjectRoundId(Integer projectRoundId);
    List<SupervisorAssignment> findByLecturerIdAndProjectRoundId(Integer lecturerId, Integer projectRoundId);
    Optional<SupervisorAssignment> findByStudentIdAndProjectRoundId(Integer studentId, Integer projectRoundId);
}
