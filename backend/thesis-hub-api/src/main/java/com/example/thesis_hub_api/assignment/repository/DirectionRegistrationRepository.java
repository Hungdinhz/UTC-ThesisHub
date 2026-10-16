package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.DirectionRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DirectionRegistrationRepository extends JpaRepository<DirectionRegistration, Long> {

    Optional<DirectionRegistration> findByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);

    List<DirectionRegistration> findByProjectRoundId(Long projectRoundId);

    List<DirectionRegistration> findByProjectRoundIdAndDirectionId(Long projectRoundId, Long directionId);

    List<DirectionRegistration> findByStudentId(Long studentId);
}
