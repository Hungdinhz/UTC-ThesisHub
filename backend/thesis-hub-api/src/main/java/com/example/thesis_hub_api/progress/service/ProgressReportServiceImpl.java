package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.organization.entity.Lecturer;
import com.example.thesis_hub_api.organization.entity.Student;
import com.example.thesis_hub_api.organization.repository.LecturerRepository;
import com.example.thesis_hub_api.organization.repository.StudentRepository;
import com.example.thesis_hub_api.progress.dto.*;
import com.example.thesis_hub_api.progress.entity.ProgressFeedback;
import com.example.thesis_hub_api.progress.entity.ProgressReport;
import com.example.thesis_hub_api.progress.entity.Task;
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
import java.util.Map;
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
        return buildSummaryForThesis(thesis);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThesisProgressSummaryResponse> getProgressSummariesByRoundAndLecturer(Long roundId, Long lecturerId) {
        List<Thesis> theses = roundId != null
                ? thesisRepository.findByProjectRoundId(roundId)
                : (lecturerId != null ? thesisRepository.findByLecturerId(lecturerId) : thesisRepository.findAll());
        List<Thesis> filteredTheses = theses.stream()
                .filter(t -> lecturerId == null || (t.getLecturer() != null && lecturerId.equals(t.getLecturer().getId())))
                .collect(Collectors.toList());

        if (filteredTheses.isEmpty()) {
            return List.of();
        }

        List<Long> thesisIds = filteredTheses.stream().map(Thesis::getId).collect(Collectors.toList());
        Map<Long, List<Task>> tasksByThesis = taskRepository.findByThesisIdIn(thesisIds).stream()
                .filter(t -> t.getThesis() != null)
                .collect(Collectors.groupingBy(t -> t.getThesis().getId()));
        Map<Long, List<ProgressReport>> reportsByThesis = progressReportRepository.findByThesisIdInOrderBySubmittedAtDesc(thesisIds).stream()
                .filter(r -> r.getThesis() != null)
                .collect(Collectors.groupingBy(r -> r.getThesis().getId()));

        return filteredTheses.stream()
                .map(t -> buildSummaryForThesis(
                        t,
                        tasksByThesis.getOrDefault(t.getId(), List.of()),
                        reportsByThesis.getOrDefault(t.getId(), List.of())
                ))
                .collect(Collectors.toList());
    }

    private ThesisProgressSummaryResponse buildSummaryForThesis(Thesis thesis) {
        Long thesisId = thesis.getId();
        List<Task> tasks = taskRepository.findByThesisId(thesisId);
        List<ProgressReport> reports = progressReportRepository.findByThesisIdOrderBySubmittedAtDesc(thesisId);
        return buildSummaryForThesis(thesis, tasks, reports);
    }

    private ThesisProgressSummaryResponse buildSummaryForThesis(Thesis thesis, List<Task> tasks, List<ProgressReport> reports) {
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        long submittedTasks = tasks.stream().filter(t -> "SUBMITTED".equalsIgnoreCase(t.getStatus())).count();
        Instant now = Instant.now();
        long overdueTasks = tasks.stream()
                .filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus()) && !"CANCELLED".equalsIgnoreCase(t.getStatus()))
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(now))
                .count();

        BigDecimal taskCompletionPercent = BigDecimal.ZERO;
        if (totalTasks > 0) {
            taskCompletionPercent = BigDecimal.valueOf((double) completedTasks / totalTasks * 100)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        long totalReports = reports.size();
        long unreviewedReports = reports.stream()
                .filter(r -> "SUBMITTED".equalsIgnoreCase(r.getStatus()) && r.getFeedback() == null)
                .count();

        Integer latestReportPercent = null;
        String latestAssessment = null;
        Instant latestReportAt = null;

        if (!reports.isEmpty()) {
            ProgressReport latest = reports.get(0);
            latestReportPercent = latest.getProgressPercent();
            latestReportAt = latest.getSubmittedAt();
            if (latest.getFeedback() != null) {
                latestAssessment = latest.getFeedback().getAssessment();
            }
        }

        boolean readyForDefense = Boolean.TRUE.equals(thesis.getDefenseEligible())
                || (thesis.getCompletionRate() != null && thesis.getCompletionRate().compareTo(BigDecimal.valueOf(80.0)) >= 0);

        String studentName = thesis.getStudent() != null && thesis.getStudent().getUser() != null ? thesis.getStudent().getUser().getFullName() : null;
        String lecturerName = thesis.getLecturer() != null && thesis.getLecturer().getUser() != null ? thesis.getLecturer().getUser().getFullName() : null;

        return ThesisProgressSummaryResponse.builder()
                .thesisId(thesis.getId())
                .thesisCode(thesis.getThesisCode())
                .thesisTitle(thesis.getTitleVn())
                .studentId(thesis.getStudent() != null ? thesis.getStudent().getId() : null)
                .studentCode(thesis.getStudent() != null ? thesis.getStudent().getStudentCode() : null)
                .studentFullName(studentName)
                .lecturerId(thesis.getLecturer() != null ? thesis.getLecturer().getId() : null)
                .lecturerFullName(lecturerName)
                .status(thesis.getStatus())
                .completionRate(thesis.getCompletionRate())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .taskCompletionPercent(taskCompletionPercent)
                .totalProgressReports(totalReports)
                .latestReportPercent(latestReportPercent)
                .latestAssessment(latestAssessment)
                .latestReportAt(latestReportAt)
                .submittedTasksCount(submittedTasks)
                .overdueTasksCount(overdueTasks)
                .unreviewedReportsCount(unreviewedReports)
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
