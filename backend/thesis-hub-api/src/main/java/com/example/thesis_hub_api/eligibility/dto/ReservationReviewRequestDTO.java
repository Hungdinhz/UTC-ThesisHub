package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationReviewRequestDTO {
    /**
     * APPROVED or REJECTED
     */
    private String status;
    private Long reviewedBy;
    private String rejectionReason;
    private String note;
}
