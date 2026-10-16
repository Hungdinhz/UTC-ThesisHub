package com.example.thesis_hub_api.progress.repository;

import com.example.thesis_hub_api.progress.entity.ProgressReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProgressReportRepository extends JpaRepository<ProgressReport, Long> {

    List<ProgressReport> findByThesisIdOrderBySubmittedAtDesc(Long thesisId);

    List<ProgressReport> findByStudentIdOrderBySubmittedAtDesc(Long studentId);

    Optional<ProgressReport> findFirstByThesisIdOrderBySubmittedAtDesc(Long thesisId);

    Page<ProgressReport> findByThesisId(Long thesisId, Pageable pageable);

    List<ProgressReport> findByThesisIdAndStatus(Long thesisId, String status);
}
