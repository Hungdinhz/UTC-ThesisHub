package com.example.thesis_hub_api.defense.repository;

import com.example.thesis_hub_api.defense.entity.ReviewerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for ReviewerAssignment.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface ReviewerAssignmentRepository extends JpaRepository<ReviewerAssignment, Long> {

    Optional<ReviewerAssignment> findByThesisId(Long thesisId);

    List<ReviewerAssignment> findByReviewerId(Long reviewerId);

    List<ReviewerAssignment> findByStatus(String status);

    List<ReviewerAssignment> findByReviewerIdAndStatus(Long reviewerId, String status);

    boolean existsByThesisId(Long thesisId);

    long countByReviewerId(Long reviewerId);
}
