package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.ProgressFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressFeedbackRepository extends JpaRepository<ProgressFeedback, Long> {
    List<ProgressFeedback> findByReportId(Long reportId);
    List<ProgressFeedback> findByLecturerId(Long lecturerId);
}
