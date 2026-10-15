package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Score.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {

    List<Score> findByThesisId(Long thesisId);

    List<Score> findByGraderId(Long graderId);

    List<Score> findByThesisIdAndScoreType(Long thesisId, String scoreType);

    Optional<Score> findByThesisIdAndGraderIdAndScoreType(Long thesisId, Long graderId, String scoreType);

    boolean existsByThesisIdAndGraderIdAndScoreType(Long thesisId, Long graderId, String scoreType);
}
