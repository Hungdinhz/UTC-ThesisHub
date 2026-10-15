package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressReportResponseDTO {
    private Long id;
    private Long thesisId;
    private Long studentId;
    private String studentName;
    private String title;
    private String content;
    private String fileUrl;
    private Instant reportDate;
    private String status;
    private Instant createdAt;
    private List<ProgressFeedbackResponseDTO> feedbacks;
}
