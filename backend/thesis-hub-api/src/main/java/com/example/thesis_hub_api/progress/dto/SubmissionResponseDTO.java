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
public class SubmissionResponseDTO {
    private Long id;
    private Long taskId;
    private Long studentId;
    private String studentName;
    private String content;
    private String fileUrl;
    private Instant submittedAt;
    private String status;
    private String feedback;
    private Instant reviewedAt;
}
