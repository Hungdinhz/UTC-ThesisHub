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
public class DirectionRegistrationResponseDTO {

    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String studentClass;
    private String trainingProgramCode;
    private Long projectRoundId;
    private String projectRoundCode;
    private Long directionId;
    private String directionCode;
    private String directionName;
    private String status;
    private Instant registeredAt;
    private String note;
}
