package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.GraduationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for GraduationResult.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface GraduationResultRepository extends JpaRepository<GraduationResult, Long> {

    Optional<GraduationResult> findByThesisId(Long thesisId);

    List<GraduationResult> findByFinalResult(String finalResult);

    List<GraduationResult> findByGrade(String grade);

    boolean existsByThesisId(Long thesisId);
}
