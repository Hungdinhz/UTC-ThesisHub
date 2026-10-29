package com.example.thesis_hub_api.progress.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    @NotNull(message = "thesisId không được để trống")
    private Long thesisId;

    private Long createdById;

    private Long assignedToId;

    @NotBlank(message = "Tiêu đề công việc không được để trống")
    private String title;

    private String description;

    @Builder.Default
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    private Instant dueDate;

    private String fileUrl;
}
