package com.example.thesis_hub_api.projectround.repository;

import com.example.thesis_hub_api.projectround.entity.ProjectRound;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRoundRepository extends JpaRepository<ProjectRound, Long> {

    Optional<ProjectRound> findByRoundCode(String roundCode);

    boolean existsByRoundCode(String roundCode);

    List<ProjectRound> findByStatus(String status);

    Optional<ProjectRound> findFirstByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT r FROM ProjectRound r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:academicYear IS NULL OR r.academicYear = :academicYear) " +
           "ORDER BY r.createdAt DESC")
    List<ProjectRound> findRoundsFiltered(
            @Param("status") String status,
            @Param("academicYear") String academicYear);

    @Query("SELECT r FROM ProjectRound r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:academicYear IS NULL OR r.academicYear = :academicYear)")
    Page<ProjectRound> searchRounds(
            @Param("status") String status,
            @Param("academicYear") String academicYear,
            Pageable pageable);
}
