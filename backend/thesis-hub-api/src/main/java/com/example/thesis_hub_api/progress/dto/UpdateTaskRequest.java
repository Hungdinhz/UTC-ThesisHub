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
public class UpdateTaskRequest {
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String status;   // TODO, IN_PROGRESS, SUBMITTED, REVISE, COMPLETED, CANCELLED
    private Instant dueDate;
    private Instant completedAt;
}
