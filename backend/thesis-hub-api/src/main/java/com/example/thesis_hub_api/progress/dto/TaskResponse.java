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
public class TaskResponse {
    private Long id;
    private Long thesisId;
    private String thesisTitle;
    private Long createdById;
    private String createdByFullName;
    private Long assignedToId;
    private String assignedToFullName;
    private String title;
    private String description;
    private String priority;
    private String status;
    private Instant dueDate;
    private Instant completedAt;
    private String fileUrl;
    private int submissionCount;
    private String latestSubmissionStatus;
    private int commentCount;
    private Instant createdAt;
    private Instant updatedAt;
}
