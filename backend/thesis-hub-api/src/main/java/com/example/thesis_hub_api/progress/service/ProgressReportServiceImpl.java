package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.progress.dto.*;
import com.example.thesis_hub_api.progress.entity.ProgressFeedback;
import com.example.thesis_hub_api.progress.entity.ProgressReport;
import com.example.thesis_hub_api.progress.repository.ProgressFeedbackRepository;
import com.example.thesis_hub_api.progress.repository.ProgressReportRepository;
import com.example.thesis_hub_api.progress.repository.TaskRepository;
import com.example.thesis_hub_api.projectround.entity.TimelineMilestone;
import com.example.thesis_hub_api.projectround.repository.TimelineMilestoneRepository;
import com.example.thesis_hub_api.thesis.entity.Thesis;
import com.example.thesis_hub_api.thesis.repository.ThesisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressReportServiceImpl implements ProgressReportService {

    private final ProgressReportRepository progressReportRepository;
    private final ProgressFeedbackRepository progressFeedbackRepository;
    private final ThesisRepository thesisRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final TimelineMilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional
    public ProgressReportResponse createReport(Long thesisId, CreateProgressReportRequest request) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", thesisId));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        TimelineMilestone milestone = null;
        if (request.getMilestoneId() != null) {
            milestone = milestoneRepository.findById(request.getMilestoneId()).orElse(null);
        }

        ProgressReport report = ProgressReport.builder()
                .thesis(thesis)
                .student(student)
                .milestone(milestone)
                .reportTitle(request.getReportTitle())
                .completedWork(request.getCompletedWork())
                .plannedWork(request.getPlannedWork())
                .difficulties(request.getDifficulties())
                .progressPercent(request.getProgressPercent())
                .fileUrl(request.getFileUrl())
                .status("SUBMITTED")
                .submittedAt(Instant.now())
                .build();

        return mapToResponse(progressReportRepository.save(report));
    }

    @Override
    @Transactional
    public ProgressReportResponse feedbackReport(Long reportId, CreateProgressFeedbackRequest request) {
        ProgressReport report = progressReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("ProgressReport", reportId));

        Lecturer lecturer = lecturerRepository.findById(request.getLecturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer", request.getLecturerId()));

        ProgressFeedback feedback = progressFeedbackRepository.findByProgressReportId(reportId)
                .orElseGet(() -> ProgressFeedback.builder()
                        .progressReport(report)
                        .lecturer(lecturer)
                        .build());

        feedback.setFeedbackContent(request.getFeedbackContent());
        feedback.setAssessment(request.getAssessment());
        feedback.setConfirmedCompletionRate(request.getConfirmedCompletionRate());
        feedback.setFeedbackAt(Instant.now());
        progressFeedbackRepository.save(feedback);

        report.setStatus("REVIEWED");
        report.setFeedback(feedback);
        ProgressReport savedReport = progressReportRepository.save(report);

        // Update thesis completion rate based on confirmed rate
        if (request.getConfirmedCompletionRate() != null) {
            Thesis thesis = report.getThesis();
            thesis.setCompletionRate(request.getConfirmedCompletionRate());
            thesisRepository.save(thesis);
        }

        return mapToResponse(savedReport);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProgressReportResponse> getReportsByThesis(Long thesisId) {
        return progressReportRepository.findByThesisIdOrderBySubmittedAtDesc(thesisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProgressReportResponse getReportById(Long id) {
        ProgressReport report = progressReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProgressReport", id));
        return mapToResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProgressReportResponse> getReportsByThesis(Long thesisId, Pageable pageable) {
        return progressReportRepository.findByThesisId(thesisId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ThesisProgressSummaryResponse getProgressSummaryByThesis(Long thesisId) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> new ResourceNotFoundException("Thesis", thesisId));

        long totalTasks = taskRepository.countByThesisId(thesisId);
        long completedTasks = taskRepository.countByThesisIdAndStatus(thesisId, "COMPLETED");

        BigDecimal taskCompletionPercent = BigDecimal.ZERO;
        if (totalTasks > 0) {
            taskCompletionPercent = BigDecimal.valueOf((double) completedTasks / totalTasks * 100)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        List<ProgressReport> reports = progressReportRepository.findByThesisIdOrderBySubmittedAtDesc(thesisId);
        long totalReports = reports.size();

        Integer latestReportPercent = null;
        String latestAssessment = null;

        if (!reports.isEmpty()) {
            ProgressReport latest = reports.get(0);
            latestReportPercent = latest.getProgressPercent();
            if (latest.getFeedback() != null) {
                latestAssessment = latest.getFeedback().getAssessment();
            }
        }

        // Ready for defense condition: >= 80% completion rate AND defenseEligible
        boolean readyForDefense = Boolean.TRUE.equals(thesis.getDefenseEligible())
                || (thesis.getCompletionRate() != null && thesis.getCompletionRate().compareTo(BigDecimal.valueOf(80.0)) >= 0);

        String studentName = thesis.getStudent().getUser() != null ? thesis.getStudent().getUser().getFullName() : null;
        String lecturerName = thesis.getLecturer().getUser() != null ? thesis.getLecturer().getUser().getFullName() : null;

        return ThesisProgressSummaryResponse.builder()
                .thesisId(thesis.getId())
                .thesisCode(thesis.getThesisCode())
                .studentId(thesis.getStudent().getId())
                .studentCode(thesis.getStudent().getStudentCode())
                .studentFullName(studentName)
                .lecturerId(thesis.getLecturer().getId())
                .lecturerFullName(lecturerName)
                .status(thesis.getStatus())
                .completionRate(thesis.getCompletionRate())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .taskCompletionPercent(taskCompletionPercent)
                .totalProgressReports(totalReports)
                .latestReportPercent(latestReportPercent)
                .latestAssessment(latestAssessment)
                .defenseEligible(thesis.getDefenseEligible())
                .readyForDefense(readyForDefense)
                .build();
    }

    private ProgressReportResponse mapToResponse(ProgressReport report) {
        String studentName = report.getStudent().getUser() != null ? report.getStudent().getUser().getFullName() : null;
        ProgressFeedbackResponse feedbackDto = null;

        if (report.getFeedback() != null) {
            ProgressFeedback fb = report.getFeedback();
            String lecturerName = fb.getLecturer().getUser() != null ? fb.getLecturer().getUser().getFullName() : null;
            feedbackDto = ProgressFeedbackResponse.builder()
                    .id(fb.getId())
                    .progressReportId(report.getId())
                    .lecturerId(fb.getLecturer().getId())
                    .lecturerFullName(lecturerName)
                    .feedbackContent(fb.getFeedbackContent())
                    .assessment(fb.getAssessment())
                    .confirmedCompletionRate(fb.getConfirmedCompletionRate())
                    .feedbackAt(fb.getFeedbackAt())
                    .createdAt(fb.getCreatedAt())
                    .updatedAt(fb.getUpdatedAt())
                    .build();
        }

        return ProgressReportResponse.builder()
                .id(report.getId())
                .thesisId(report.getThesis().getId())
                .thesisTitle(report.getThesis().getTitleVn())
                .studentId(report.getStudent().getId())
                .studentCode(report.getStudent().getStudentCode())
                .studentFullName(studentName)
                .milestoneId(report.getMilestone() != null ? report.getMilestone().getId() : null)
                .milestoneName(report.getMilestone() != null ? report.getMilestone().getName() : null)
                .reportTitle(report.getReportTitle())
                .completedWork(report.getCompletedWork())
                .plannedWork(report.getPlannedWork())
                .difficulties(report.getDifficulties())
                .progressPercent(report.getProgressPercent())
                .fileUrl(report.getFileUrl())
                .status(report.getStatus())
                .submittedAt(report.getSubmittedAt())
                .feedback(feedbackDto)
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
