package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.ProgressFeedbackCreateDTO;
import com.example.thesis_hub_api.progress.dto.ProgressFeedbackResponseDTO;
import com.example.thesis_hub_api.progress.dto.ProgressReportCreateDTO;
import com.example.thesis_hub_api.progress.dto.ProgressReportResponseDTO;
import com.example.thesis_hub_api.progress.entity.ProgressFeedback;
import com.example.thesis_hub_api.progress.entity.ProgressReport;
import com.example.thesis_hub_api.progress.repository.ProgressFeedbackRepository;
import com.example.thesis_hub_api.progress.repository.ProgressReportRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressReportService {

    private final ProgressReportRepository reportRepository;
    private final ProgressFeedbackRepository feedbackRepository;
    private final ExternalAssignmentMockService mockService;

    @Transactional
    public ProgressReportResponseDTO createReport(ProgressReportCreateDTO request) {
        ProgressReport report = ProgressReport.builder()
                .thesisId(request.getThesisId())
                .studentId(request.getStudentId())
                .title(request.getTitle())
                .content(request.getContent())
                .fileUrl(request.getFileUrl())
                .reportDate(request.getReportDate())
                .status("SUBMITTED")
                .build();
        
        ProgressReport saved = reportRepository.save(report);
        return mapToResponse(saved);
    }

    @Transactional
    public ProgressFeedbackResponseDTO addFeedback(Long reportId, ProgressFeedbackCreateDTO request) {
        ProgressFeedback feedback = ProgressFeedback.builder()
                .reportId(reportId)
                .lecturerId(request.getLecturerId())
                .feedback(request.getFeedback())
                .isSatisfactory(request.getIsSatisfactory())
                .build();
                
        ProgressFeedback saved = feedbackRepository.save(feedback);
        
        ProgressReport report = reportRepository.findById(reportId).orElseThrow();
        report.setStatus("REVIEWED");
        reportRepository.save(report);
        
        return mapToFeedbackResponse(saved);
    }

    public List<ProgressReportResponseDTO> getReportsByThesis(Long thesisId) {
        return reportRepository.findByThesisId(thesisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ProgressReportResponseDTO mapToResponse(ProgressReport report) {
        String studentName = mockService.getStudent(report.getStudentId())
                .map(ExternalAssignmentMockService.MockStudent::getFullName)
                .orElse("Student " + report.getStudentId());

        List<ProgressFeedbackResponseDTO> feedbacks = feedbackRepository.findByReportId(report.getId())
                .stream().map(this::mapToFeedbackResponse).collect(Collectors.toList());

        return ProgressReportResponseDTO.builder()
                .id(report.getId())
                .thesisId(report.getThesisId())
                .studentId(report.getStudentId())
                .studentName(studentName)
                .title(report.getTitle())
                .content(report.getContent())
                .fileUrl(report.getFileUrl())
                .reportDate(report.getReportDate())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .feedbacks(feedbacks)
                .build();
    }

    private ProgressFeedbackResponseDTO mapToFeedbackResponse(ProgressFeedback f) {
        String lecturerName = mockService.getLecturer(f.getLecturerId())
                .map(ExternalAssignmentMockService.MockLecturer::getFullName)
                .orElse("Lecturer " + f.getLecturerId());

        return ProgressFeedbackResponseDTO.builder()
                .id(f.getId())
                .reportId(f.getReportId())
                .lecturerId(f.getLecturerId())
                .lecturerName(lecturerName)
                .feedback(f.getFeedback())
                .isSatisfactory(f.getIsSatisfactory())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
