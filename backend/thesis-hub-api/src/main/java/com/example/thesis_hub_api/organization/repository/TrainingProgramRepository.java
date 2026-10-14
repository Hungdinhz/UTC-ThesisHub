package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.TrainingProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, Long> {
    Optional<TrainingProgram> findByCode(String code);
    boolean existsByCode(String code);
}
