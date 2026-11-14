package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationSubmitRequestDTO {
    private Long studentId;
    private Long thesisId;
    private Long projectRoundId;

    /**
     * Category of reservation reason:
     * INSUFFICIENT_CREDITS, SUPERVISOR_NOT_ELIGIBLE, RESEARCH_PROGRESS,
     * HEALTH_REASONS, INTERNSHIP_WORK, FAMILY_CIRCUMSTANCES, OTHER.
     */
    private String reasonCategory;
    private String reason;
    private String evidenceFileUrl;
    private String evidenceFileName;
    private String targetRoundCode;
    private String note;
}
