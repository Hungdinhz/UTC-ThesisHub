package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.Preference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreferenceRepository extends JpaRepository<Preference, Long> {

    List<Preference> findByStudentIdAndProjectRoundIdOrderByPriorityAsc(Long studentId, Long projectRoundId);

    List<Preference> findByProjectRoundIdOrderByStudentIdAscPriorityAsc(Long projectRoundId);

    List<Preference> findByProjectRoundIdAndLecturerId(Long projectRoundId, Long lecturerId);

    Optional<Preference> findByStudentIdAndProjectRoundIdAndPriority(Long studentId, Long projectRoundId, Integer priority);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Preference p WHERE p.studentId = :studentId AND p.projectRoundId = :projectRoundId")
    void deleteByStudentIdAndProjectRoundId(@Param("studentId") Long studentId, @Param("projectRoundId") Long projectRoundId);
}
