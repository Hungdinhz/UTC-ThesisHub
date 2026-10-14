package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByCode(String code);
    boolean existsByCode(String code);
    List<Department> findByFacultyId(Long facultyId);
}
