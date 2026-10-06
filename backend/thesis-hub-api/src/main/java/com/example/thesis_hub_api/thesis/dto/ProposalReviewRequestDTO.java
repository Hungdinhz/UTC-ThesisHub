package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalReviewRequestDTO {
    private String result; // APPROVED, REVISION_REQUIRED, REJECTED
    private String feedback;
    private Long reviewerId;
}
