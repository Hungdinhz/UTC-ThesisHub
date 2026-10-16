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
public class SubmissionResponse {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private Long studentId;
    private String studentCode;
    private String studentFullName;
    private String title;
    private String submissionContent;
    private String fileUrl;
    private String status;
    private String reviewFeedback;
    private Instant reviewedAt;
    private Instant submittedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
