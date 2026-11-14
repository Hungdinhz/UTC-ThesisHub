package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateReservationRequestDTO {
    private Long studentId;
    private Long thesisId;
    private Long projectRoundId;
    private String reasonCategory;
    private String reason;
    private String evidenceFileUrl;
    private String evidenceFileName;
    private String targetRoundCode;
    private Boolean autoApprove;
    private Long reviewedBy;
    private String note;
}
