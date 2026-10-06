package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressFeedbackResponseDTO {
    private Long id;
    private Long reportId;
    private Long lecturerId;
    private String lecturerName;
    private String feedback;
    private Boolean isSatisfactory;
    private Instant createdAt;
}
