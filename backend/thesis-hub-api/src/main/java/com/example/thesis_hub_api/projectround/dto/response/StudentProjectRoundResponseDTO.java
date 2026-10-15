package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProjectRoundResponseDTO {

    private Long studentRoundId;
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private String className;
    private Long majorId;
    private String majorCode;
    private String majorName;
    private Long trainingProgramId;
    private String trainingProgram;
    private String status;
    private Integer debtCredits;
    private String note;
    private Instant enrolledAt;
}
