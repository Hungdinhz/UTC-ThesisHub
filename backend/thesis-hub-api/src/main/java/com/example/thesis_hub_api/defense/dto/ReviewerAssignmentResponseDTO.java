package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerAssignmentResponseDTO {
    private Long id;
    private Long thesisId;
    private Long reviewerId;
    private String reviewerName;
    private Long assignedBy;
    private Instant assignedAt;
    private String status;
    private String reviewFileUrl;
    private String reviewNotes;
    private String note;
}
