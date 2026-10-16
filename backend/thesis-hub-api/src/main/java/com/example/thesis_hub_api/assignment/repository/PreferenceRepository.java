package com.example.thesis_hub_api.assignment.repository;

import com.example.thesis_hub_api.assignment.entity.Preference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreferenceRepository extends JpaRepository<Preference, Long> {

    List<Preference> findByStudentIdAndProjectRoundIdOrderByPriorityAsc(Long studentId, Long projectRoundId);

    List<Preference> findByProjectRoundIdOrderByStudentIdAscPriorityAsc(Long projectRoundId);

    List<Preference> findByProjectRoundIdAndLecturerId(Long projectRoundId, Long lecturerId);

    Optional<Preference> findByStudentIdAndProjectRoundIdAndPriority(Long studentId, Long projectRoundId, Integer priority);

    void deleteByStudentIdAndProjectRoundId(Long studentId, Long projectRoundId);
}
