package com.example.thesis_hub_api.progress.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubmissionRequest {

    @NotNull(message = "studentId không được để trống")
    private Long studentId;

    private String title;
    private String submissionContent;
    private String fileUrl;
}
