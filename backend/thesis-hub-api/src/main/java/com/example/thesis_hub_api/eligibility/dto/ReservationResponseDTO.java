package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponseDTO {
    private Long id;
    private Long studentId;
    private Long thesisId;
    private Long projectRoundId;
    private String reason;
    private String status;
    private Instant submittedAt;
    private Long reviewedBy;
    private Instant reviewedAt;
    private String rejectionReason;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
