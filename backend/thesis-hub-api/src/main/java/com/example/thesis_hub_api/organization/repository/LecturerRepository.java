package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LecturerRepository extends JpaRepository<Lecturer, Long> {
    Optional<Lecturer> findByUserId(Long userId);
    Optional<Lecturer> findByLecturerCode(String lecturerCode);
    boolean existsByLecturerCode(String lecturerCode);
    List<Lecturer> findByDepartmentId(Long departmentId);
    Page<Lecturer> findByAcademicDegree(String academicDegree, Pageable pageable);
}
