package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.CouncilMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for CouncilMember.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface CouncilMemberRepository extends JpaRepository<CouncilMember, Long> {

    List<CouncilMember> findByCouncilId(Long councilId);

    List<CouncilMember> findByLecturerId(Long lecturerId);

    List<CouncilMember> findByCouncilIdAndRole(Long councilId, String role);

    Optional<CouncilMember> findByCouncilIdAndLecturerId(Long councilId, Long lecturerId);

    boolean existsByCouncilIdAndLecturerId(Long councilId, Long lecturerId);

    long countByCouncilId(Long councilId);

    long countByLecturerId(Long lecturerId);
}
