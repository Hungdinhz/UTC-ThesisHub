package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressFeedbackCreateDTO {
    private Long reportId;
    private Long lecturerId;
    private String feedback;
    private Boolean isSatisfactory;
}
