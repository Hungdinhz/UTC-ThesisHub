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
    private String studentCode;
    private String studentName;
    private Long thesisId;
    private String thesisTitle;
    private Long projectRoundId;
    private String roundCode;
    private String reasonCategory;
    private String reason;
    private String evidenceFileUrl;
    private String evidenceFileName;
    private Boolean supervisorApproved;
    private String supervisorComment;
    private String targetRoundCode;
    private String status;
    private Instant submittedAt;
    private Long reviewedBy;
    private String reviewerName;
    private Instant reviewedAt;
    private String rejectionReason;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
