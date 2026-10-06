package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.ProgressReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressReportRepository extends JpaRepository<ProgressReport, Long> {
    List<ProgressReport> findByThesisId(Long thesisId);
    List<ProgressReport> findByStudentId(Long studentId);
}
