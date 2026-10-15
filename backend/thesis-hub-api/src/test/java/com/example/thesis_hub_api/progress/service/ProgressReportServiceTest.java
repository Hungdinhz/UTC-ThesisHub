package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.ProgressReportCreateDTO;
import com.example.thesis_hub_api.progress.dto.ProgressReportResponseDTO;
import com.example.thesis_hub_api.progress.entity.ProgressReport;
import com.example.thesis_hub_api.progress.repository.ProgressFeedbackRepository;
import com.example.thesis_hub_api.progress.repository.ProgressReportRepository;
import com.example.thesis_hub_api.thesis.service.mock.ExternalAssignmentMockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProgressReportServiceTest {

    @Mock
    private ProgressReportRepository reportRepository;

    @Mock
    private ProgressFeedbackRepository feedbackRepository;

    @Mock
    private ExternalAssignmentMockService mockService;

    @InjectMocks
    private ProgressReportService reportService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createReport_Success() {
        ProgressReportCreateDTO request = new ProgressReportCreateDTO();
        request.setThesisId(1L);
        request.setStudentId(10L);
        request.setTitle("Báo cáo tuần 1");

        ProgressReport report = new ProgressReport();
        report.setId(20L);
        report.setThesisId(1L);
        report.setStudentId(10L);
        report.setTitle("Báo cáo tuần 1");
        report.setStatus("SUBMITTED");
        report.setCreatedAt(Instant.now());

        when(reportRepository.save(any(ProgressReport.class))).thenReturn(report);
        when(feedbackRepository.findByReportId(20L)).thenReturn(new ArrayList<>());
        when(mockService.getStudent(10L)).thenReturn(Optional.empty());

        ProgressReportResponseDTO response = reportService.createReport(request);

        assertNotNull(response);
        assertEquals(20L, response.getId());
        assertEquals("SUBMITTED", response.getStatus());
        verify(reportRepository, times(1)).save(any(ProgressReport.class));
    }
}
