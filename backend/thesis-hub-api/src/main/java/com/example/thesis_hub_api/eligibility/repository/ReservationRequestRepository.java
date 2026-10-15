package com.example.thesis_hub_api.eligibility.repository;

import com.example.thesis_hub_api.eligibility.entity.ReservationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for ReservationRequest.
 * Module: Eligibility & Defense (Owner: Khuat Dang Khoa)
 */
@Repository
public interface ReservationRequestRepository extends JpaRepository<ReservationRequest, Long> {

    List<ReservationRequest> findByStudentId(Long studentId);

    List<ReservationRequest> findByProjectRoundId(Long projectRoundId);

    List<ReservationRequest> findByStatus(String status);

    Optional<ReservationRequest> findByStudentIdAndStatus(Long studentId, String status);

    List<ReservationRequest> findByProjectRoundIdAndStatus(Long projectRoundId, String status);

    Optional<ReservationRequest> findByThesisId(Long thesisId);
}
