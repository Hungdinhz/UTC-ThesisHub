package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceResponseDTO {

    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String trainingProgramCode;
    private Long projectRoundId;
    private Long lecturerId;
    private String lecturerCode;
    private String lecturerName;
    private String academicDegree;
    private Integer priority;
    private Double gpa;
    private String prioritizationCriteria;
    private String status;
    private Instant createdAt;
}
