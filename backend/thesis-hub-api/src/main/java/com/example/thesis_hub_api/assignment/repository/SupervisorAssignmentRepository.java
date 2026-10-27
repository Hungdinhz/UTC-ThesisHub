package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupervisorAssignmentRepository extends JpaRepository<SupervisorAssignment, Long> {

    Optional<SupervisorAssignment> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    List<SupervisorAssignment> findByProjectRoundId(Long projectRoundId);

    List<SupervisorAssignment> findByLecturerId(Long lecturerId);

    List<SupervisorAssignment> findByProjectRoundIdAndLecturerId(Long projectRoundId, Long lecturerId);

    List<SupervisorAssignment> findByProjectRoundIdAndStatus(Long projectRoundId, String status);

    long countByProjectRoundIdAndStatus(Long projectRoundId, String status);

    void deleteByProjectRoundIdAndStatus(Long projectRoundId, String status);
}
