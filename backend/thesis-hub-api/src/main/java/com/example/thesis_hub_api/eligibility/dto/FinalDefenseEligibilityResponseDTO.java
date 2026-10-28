package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalDefenseEligibilityResponseDTO {
    private Long studentId;
    private String studentCode;
    private String studentName;
    private Long thesisId;
    private String thesisTitle;
    private boolean eligibleForDefense;
    private double thesisProgressPercentage;
    private boolean allProgressStagesCompleted;
    private boolean supervisorApproved;
    private BigDecimal supervisorScore;
    private boolean reviewerAssigned;
    private BigDecimal reviewerScore;
    private double plagiarismRate;
    private List<String> reasons;
}
