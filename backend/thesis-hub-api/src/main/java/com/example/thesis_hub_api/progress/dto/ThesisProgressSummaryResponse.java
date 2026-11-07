package com.example.thesis_hub_api.progress.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Summary DTO provided to Module 4 (Khuat Dang Khoa - Eligibility & Defense)
 * to verify if a thesis and student meet the defense criteria.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThesisProgressSummaryResponse {
    private Long thesisId;
    private String thesisCode;
    private String thesisTitle;
    private Long studentId;
    private String studentCode;
    private String studentFullName;
    private Long lecturerId;
    private String lecturerFullName;
    private String status;
    private BigDecimal completionRate;
    private long totalTasks;
    private long completedTasks;
    private BigDecimal taskCompletionPercent;
    private long totalProgressReports;
    private Integer latestReportPercent;
    private String latestAssessment;
    private Instant latestReportAt;
    private long submittedTasksCount;
    private long overdueTasksCount;
    private long unreviewedReportsCount;
    private Boolean defenseEligible;
    private boolean readyForDefense;
}
