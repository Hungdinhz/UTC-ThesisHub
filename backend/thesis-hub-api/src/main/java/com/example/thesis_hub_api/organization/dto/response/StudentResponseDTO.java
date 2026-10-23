package com.example.thesis_hub_api.organization.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDTO {

    private Long studentId;
    private Long userId;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String className;
    private Long majorId;
    private String majorName;
    private Long trainingProgramId;
    private String trainingProgramName;
    private LocalDate dateOfBirth;
    private String gender;
    private Integer debtCredits;
    private Boolean isActive;
    private java.util.List<String> projectRoundCodes;
    private java.util.List<String> projectRoundNames;
}
