package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectDirectionRepository extends JpaRepository<ProjectDirection, Integer> {
    List<ProjectDirection> findByProjectRoundIdAndIsActiveTrue(Integer projectRoundId);
}
