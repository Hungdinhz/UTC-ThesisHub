package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MajorRepository extends JpaRepository<Major, Long> {
    Optional<Major> findByCode(String code);
    boolean existsByCode(String code);
    List<Major> findByFacultyId(Long facultyId);
    List<Major> findByDepartmentId(Long departmentId);
}
