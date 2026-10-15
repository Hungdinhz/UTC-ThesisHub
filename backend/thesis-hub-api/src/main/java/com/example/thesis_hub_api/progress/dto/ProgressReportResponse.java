package com.example.thesis_hub_api.progress.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressReportResponse {
    private Long id;
    private Long thesisId;
    private String thesisTitle;
    private Long studentId;
    private String studentCode;
    private String studentFullName;
    private Long milestoneId;
    private String milestoneName;
    private String reportTitle;
    private String completedWork;
    private String plannedWork;
    private String difficulties;
    private Integer progressPercent;
    private String fileUrl;
    private String status;
    private Instant submittedAt;
    private ProgressFeedbackResponse feedback;
    private Instant createdAt;
    private Instant updatedAt;
}
