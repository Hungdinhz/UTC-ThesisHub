package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentExportDto {
    private Integer studentId;
    private Integer lecturerId;
    private Integer projectDirectionId;
    private Integer projectRoundId;
}
