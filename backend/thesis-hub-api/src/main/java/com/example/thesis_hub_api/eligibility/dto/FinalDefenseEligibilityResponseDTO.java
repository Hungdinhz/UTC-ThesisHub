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
    private Long thesisId;
    private boolean eligibleForDefense;
    private double thesisProgressPercentage;
    private boolean supervisorApproved;
    private BigDecimal supervisorScore;
    private boolean reviewerAssigned;
    private BigDecimal reviewerScore;
    private List<String> reasons;
}
