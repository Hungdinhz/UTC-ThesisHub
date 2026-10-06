package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionCreateDTO {
    private Long taskId;
    private Long studentId;
    private String content;
    private String fileUrl;
}
