package com.example.thesis_hub_api.progress.service;

import com.example.thesis_hub_api.progress.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProgressReportService {

    ProgressReportResponse createReport(Long thesisId, CreateProgressReportRequest request);

    ProgressReportResponse feedbackReport(Long reportId, CreateProgressFeedbackRequest request);

    List<ProgressReportResponse> getReportsByThesis(Long thesisId);

    ProgressReportResponse getReportById(Long id);

    Page<ProgressReportResponse> getReportsByThesis(Long thesisId, Pageable pageable);

    ThesisProgressSummaryResponse getProgressSummaryByThesis(Long thesisId);
}
