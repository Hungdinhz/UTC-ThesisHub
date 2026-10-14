package com.example.thesis_hub_api.organization.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentRequestDTO {

    private String fullName;
    private String phone;
    private String className;
    private Long majorId;
    private Long trainingProgramId;
    private LocalDate dateOfBirth;
    private String gender;
    private Integer debtCredits;
    private Boolean isActive;
}
