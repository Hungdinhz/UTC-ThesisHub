package com.example.thesis_hub_api.thesis.repository;

import com.example.thesis_hub_api.thesis.entity.Thesis;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThesisRepository extends JpaRepository<Thesis, Long> {

    Optional<Thesis> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    Optional<Thesis> findByThesisCode(String thesisCode);

    boolean existsByThesisCode(String thesisCode);

    boolean existsByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    List<Thesis> findByProjectRoundId(Long projectRoundId);

    List<Thesis> findByLecturerId(Long lecturerId);

    List<Thesis> findByProjectRoundIdAndStatus(Long projectRoundId, String status);

    List<Thesis> findByProjectRoundIdAndDefenseEligible(Long projectRoundId, Boolean defenseEligible);

    @Query("SELECT t FROM Thesis t WHERE " +
           "(:roundId IS NULL OR t.projectRound.id = :roundId) AND " +
           "(:lecturerId IS NULL OR t.lecturer.id = :lecturerId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:defenseEligible IS NULL OR t.defenseEligible = :defenseEligible) AND " +
           "(:search IS NULL OR " +
           "LOWER(t.titleVn) LIKE :search OR " +
           "LOWER(t.thesisCode) LIKE :search OR " +
           "LOWER(t.student.studentCode) LIKE :search)")
    Page<Thesis> searchTheses(
            @Param("roundId") Long roundId,
            @Param("lecturerId") Long lecturerId,
            @Param("status") String status,
            @Param("defenseEligible") Boolean defenseEligible,
            @Param("search") String search,
            Pageable pageable);
}
