package com.example.thesis_hub_api.organization.repository;

import com.example.thesis_hub_api.organization.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(Long userId);
    Optional<Student> findByStudentCode(String studentCode);
    boolean existsByStudentCode(String studentCode);
    Page<Student> findByMajorId(Long majorId, Pageable pageable);

    @Query("SELECT s FROM Student s JOIN s.user u WHERE " +
           "(:projectRoundId IS NULL OR s.id IN (SELECT spr.student.id FROM StudentProjectRound spr WHERE spr.projectRound.id = :projectRoundId)) AND " +
           "(:majorId IS NULL OR s.majorId = :majorId) AND " +
           "(:trainingProgramId IS NULL OR s.trainingProgramId = :trainingProgramId) AND " +
           "(:className IS NULL OR LOWER(s.className) LIKE :className) AND " +
           "(:search IS NULL OR " +
           " LOWER(s.studentCode) LIKE :search OR " +
           " LOWER(u.fullName) LIKE :search OR " +
           " LOWER(u.email) LIKE :search OR " +
           " LOWER(s.className) LIKE :search)")
    Page<Student> searchStudents(
            @Param("majorId") Long majorId,
            @Param("trainingProgramId") Long trainingProgramId,
            @Param("className") String className,
            @Param("search") String search,
            @Param("projectRoundId") Long projectRoundId,
            Pageable pageable);

    default Page<Student> searchStudents(Long majorId, Long trainingProgramId, String className, String search, Pageable pageable) {
        return searchStudents(majorId, trainingProgramId, className, search, null, pageable);
    }
}