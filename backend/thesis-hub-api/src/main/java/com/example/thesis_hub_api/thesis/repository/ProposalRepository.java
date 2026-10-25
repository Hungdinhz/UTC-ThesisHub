package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.Proposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    Optional<Proposal> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    boolean existsByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    List<Proposal> findByProjectRoundId(Long projectRoundId);

    List<Proposal> findByLecturerId(Long lecturerId);

    List<Proposal> findByProjectRoundIdAndStatus(Long projectRoundId, String status);

    @Query("SELECT p FROM Proposal p WHERE " +
           "(:roundId IS NULL OR p.projectRound.id = :roundId) AND " +
           "(:lecturerId IS NULL OR p.lecturer.id = :lecturerId) AND " +
           "(:studentId IS NULL OR p.student.id = :studentId) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:search IS NULL OR " +
           "LOWER(p.titleVn) LIKE :search OR " +
           "LOWER(p.student.studentCode) LIKE :search)")
    Page<Proposal> searchProposals(
            @Param("roundId") Long roundId,
            @Param("lecturerId") Long lecturerId,
            @Param("studentId") Long studentId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);
}
