package com.example.thesis_hub_api.projectround.repository;

import com.example.thesis_hub_api.projectround.entity.StudentProjectRound;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProjectRoundRepository extends JpaRepository<StudentProjectRound, Long> {

    Optional<StudentProjectRound> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    boolean existsByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    List<StudentProjectRound> findByProjectRoundId(Long projectRoundId);

    long countByProjectRoundId(Long projectRoundId);

    @Query("SELECT spr FROM StudentProjectRound spr " +
           "JOIN spr.student s " +
           "JOIN s.user u " +
           "WHERE spr.projectRound.id = :roundId " +
           "AND (:majorId IS NULL OR s.majorId = :majorId) " +
           "AND (:status IS NULL OR spr.status = :status) " +
           "AND (:search IS NULL OR " +
           "     LOWER(s.studentCode) LIKE :search OR " +
           "     LOWER(u.fullName) LIKE :search OR " +
           "     LOWER(u.email) LIKE :search OR " +
           "     LOWER(s.className) LIKE :search)")
    Page<StudentProjectRound> searchStudentsInRound(
            @Param("roundId") Long roundId,
            @Param("majorId") Long majorId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);
}