package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupervisorAssignmentRepository extends JpaRepository<SupervisorAssignment, Long> {

    Optional<SupervisorAssignment> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    List<SupervisorAssignment> findByStudentId(Long studentId);

    List<SupervisorAssignment> findByProjectRoundId(Long projectRoundId);

    List<SupervisorAssignment> findByLecturerId(Long lecturerId);

    List<SupervisorAssignment> findByProjectRoundIdAndLecturerId(Long projectRoundId, Long lecturerId);

    List<SupervisorAssignment> findByProjectRoundIdAndStatus(Long projectRoundId, String status);

    long countByProjectRoundIdAndStatus(Long projectRoundId, String status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM SupervisorAssignment sa WHERE sa.projectRoundId = :projectRoundId AND sa.status = :status")
    void deleteByProjectRoundIdAndStatus(@Param("projectRoundId") Long projectRoundId, @Param("status") String status);
}
