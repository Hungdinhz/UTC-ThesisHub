package com.example.thesis_hub_api.progress.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressFeedbackResponse {
    private Long id;
    private Long progressReportId;
    private Long lecturerId;
    private String lecturerFullName;
    private String feedbackContent;
    private String assessment;
    private BigDecimal confirmedCompletionRate;
    private Instant feedbackAt;
    private Instant createdAt;
    private Instant updatedAt;
}
