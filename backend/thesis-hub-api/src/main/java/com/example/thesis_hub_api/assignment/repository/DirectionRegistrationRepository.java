package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.DirectionRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DirectionRegistrationRepository extends JpaRepository<DirectionRegistration, Integer> {
    Optional<DirectionRegistration> findByStudentIdAndProjectRoundId(Integer studentId, Integer projectRoundId);
}
