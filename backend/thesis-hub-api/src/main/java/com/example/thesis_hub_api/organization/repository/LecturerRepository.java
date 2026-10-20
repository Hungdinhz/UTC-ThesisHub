package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.Lecturer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT l FROM Lecturer l JOIN l.user u WHERE " +
           "(:departmentId IS NULL OR l.departmentId = :departmentId) AND " +
           "(:degree IS NULL OR l.academicDegree = :degree) AND " +
           "(:search IS NULL OR " +
           " LOWER(l.lecturerCode) LIKE :search OR " +
           " LOWER(u.fullName) LIKE :search OR " +
           " LOWER(u.email) LIKE :search OR " +
           " LOWER(l.researchInterests) LIKE :search)")
    List<Lecturer> findLecturersFiltered(
            @Param("departmentId") Long departmentId,
            @Param("degree") String degree,
            @Param("search") String search);

    @Query("SELECT l FROM Lecturer l JOIN l.user u WHERE " +
           "(:departmentId IS NULL OR l.departmentId = :departmentId) AND " +
           "(:degree IS NULL OR l.academicDegree = :degree) AND " +
           "(:search IS NULL OR " +
           " LOWER(l.lecturerCode) LIKE :search OR " +
           " LOWER(u.fullName) LIKE :search OR " +
           " LOWER(u.email) LIKE :search OR " +
           " LOWER(l.researchInterests) LIKE :search)")
    Page<Lecturer> searchLecturers(
            @Param("departmentId") Long departmentId,
            @Param("degree") String degree,
            @Param("search") String search,
            Pageable pageable);
}