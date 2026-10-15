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
public class TaskResponseDTO {
    private Long id;
    private Long thesisId;
    private Long assigneeId;
    private String assigneeName;
    private Long assignerId;
    private String assignerName;
    private String title;
    private String description;
    private Instant dueDate;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
