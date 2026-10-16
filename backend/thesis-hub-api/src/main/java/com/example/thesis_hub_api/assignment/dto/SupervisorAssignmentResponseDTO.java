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
public class SupervisorAssignmentResponseDTO {

    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String studentClass;
    private String trainingProgramCode;
    private Long lecturerId;
    private String lecturerCode;
    private String lecturerName;
    private String academicDegree;
    private String departmentName;
    private Long projectRoundId;
    private Long directionId;
    private String directionCode;
    private String directionName;
    private Integer matchedPriority; // 1, 2, 3, 0 (fallback)
    private Double matchScore;
    private String assignmentMethod;
    private String status;
    private Boolean isOverridden;
    private Long previousLecturerId;
    private String previousLecturerName;
    private String overrideReason;
    private Instant overriddenAt;
    private Instant finalizedAt;
    private String note;
}
