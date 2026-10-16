package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectDirectionRepository extends JpaRepository<ProjectDirection, Long> {

    Optional<ProjectDirection> findByCode(String code);

    List<ProjectDirection> findByIsActiveTrue();

    List<ProjectDirection> findByDepartmentId(Long departmentId);
}
