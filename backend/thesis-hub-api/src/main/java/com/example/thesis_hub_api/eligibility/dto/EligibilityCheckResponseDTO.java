package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityCheckResponseDTO {
    private Long studentId;
    private String studentCode;
    private String fullName;
    private Long projectRoundId;
    private String status; // ELIGIBLE, INELIGIBLE, FORCE_APPROVED, DISQUALIFIED
    private int completedCredits;
    private int requiredCredits;
    private double gpa;
    private double requiredGpa;
    private boolean tuitionDebt;
    private boolean underDisciplinaryAction;
    private int missingPrerequisiteCount;
    private List<String> reasons;
}
