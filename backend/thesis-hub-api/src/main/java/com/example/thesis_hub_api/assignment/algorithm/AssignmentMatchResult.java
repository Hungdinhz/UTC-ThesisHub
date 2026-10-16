package com.example.thesis_hub_api.assignment.algorithm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentMatchResult {

    private Long studentId;
    private Long lecturerId;
    private Long directionId;
    private Integer matchedPriority; // 1 (NV1), 2 (NV2), 3 (NV3), or null / 0 (Fallback)
    private Double matchScore;
    private String status; // "PROPOSED", "UNASSIGNED"
    private String assignmentMethod; // "ALGORITHM"
    private String notes;
}
