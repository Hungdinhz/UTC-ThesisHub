package com.example.thesis_hub_api.academicstaff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibleStudentRowDTO {
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String className;
    private String majorName;
    private Integer completedCredits;
    private Integer debtCredits;
    private Double gpa;
    /** ELIGIBLE, FORCE_APPROVED, INELIGIBLE, RESERVED, DISQUALIFIED, NO_DATA */
    private String status;
    private boolean eligible;
    private List<String> reasons;
}
