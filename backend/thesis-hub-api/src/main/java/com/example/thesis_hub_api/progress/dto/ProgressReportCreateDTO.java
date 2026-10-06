package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressReportCreateDTO {
    private Long thesisId;
    private Long studentId;
    private String title;
    private String content;
    private String fileUrl;
    private Instant reportDate;
}
