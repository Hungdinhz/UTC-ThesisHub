package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.ProgressFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressFeedbackRepository extends JpaRepository<ProgressFeedback, Long> {

    Optional<ProgressFeedback> findByProgressReportId(Long progressReportId);

    List<ProgressFeedback> findByLecturerId(Long lecturerId);

    boolean existsByProgressReportId(Long progressReportId);
}
