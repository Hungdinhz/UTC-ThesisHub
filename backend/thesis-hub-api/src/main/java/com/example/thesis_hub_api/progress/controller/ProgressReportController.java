package com.example.thesis_hub_api.progress.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.progress.dto.*;
import com.example.thesis_hub_api.progress.service.ProgressReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/progress-reports")
@RequiredArgsConstructor
public class ProgressReportController {

    private final ProgressReportService progressReportService;

    @PostMapping("/by-thesis/{thesisId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ApiResponse<ProgressReportResponse> createReport(
            @PathVariable Long thesisId,
            @Valid @RequestBody CreateProgressReportRequest request) {
        return ApiResponse.success("Nộp báo cáo tiến độ thành công",
                progressReportService.createReport(thesisId, request));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE', 'ADMIN')")
    public ApiResponse<ProgressReportResponse> feedbackReport(
            @PathVariable Long id,
            @Valid @RequestBody CreateProgressFeedbackRequest request) {
        return ApiResponse.success("Đánh giá nhận xét báo cáo tiến độ thành công",
                progressReportService.feedbackReport(id, request));
    }

    @GetMapping("/by-thesis/{thesisId}")
    public ApiResponse<List<ProgressReportResponse>> getReportsByThesis(@PathVariable Long thesisId) {
        return ApiResponse.success(progressReportService.getReportsByThesis(thesisId));
    }

    @GetMapping("/by-thesis/{thesisId}/paged")
    public ApiResponse<Page<ProgressReportResponse>> getReportsByThesisPaged(
            @PathVariable Long thesisId,
            Pageable pageable) {
        return ApiResponse.success(progressReportService.getReportsByThesis(thesisId, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProgressReportResponse> getReportById(@PathVariable Long id) {
        return ApiResponse.success(progressReportService.getReportById(id));
    }

    /**
     * Inter-module endpoint for Module 4 (Eligibility & Defense - Khuat Dang Khoa)
     * Provides aggregated progress data, task counts, and defense readiness status.
     */
    @GetMapping("/by-thesis/{thesisId}/summary")
    public ApiResponse<ThesisProgressSummaryResponse> getProgressSummaryByThesis(@PathVariable Long thesisId) {
        return ApiResponse.success(progressReportService.getProgressSummaryByThesis(thesisId));
    }
}
