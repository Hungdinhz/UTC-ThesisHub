package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.DefenseCouncil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for DefenseCouncil.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface DefenseCouncilRepository extends JpaRepository<DefenseCouncil, Long> {

    List<DefenseCouncil> findByProjectRoundId(Long projectRoundId);

    List<DefenseCouncil> findByProjectRoundIdAndStatus(Long projectRoundId, String status);

    Optional<DefenseCouncil> findByProjectRoundIdAndCode(Long projectRoundId, String code);

    boolean existsByProjectRoundIdAndCode(Long projectRoundId, String code);
}
