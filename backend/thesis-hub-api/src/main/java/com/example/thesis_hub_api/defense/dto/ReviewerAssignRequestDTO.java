package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerAssignRequestDTO {
    private Long thesisId;
    private Long reviewerId;
    private Long assignedBy;
    private String note;
}
