package com.example.thesis_hub_api.projectround.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoundStudentDTO {

    private String fullName;
    private String className;
    private Long majorId;
    private String email;
    private String phone;
    private Double gpa;
    private Integer completedCredits;
    private Integer debtCredits;
    private Boolean tuitionDebt;
    private Boolean underDisciplinaryAction;
    private Integer missingPrerequisiteCount;
    private String note;
}

