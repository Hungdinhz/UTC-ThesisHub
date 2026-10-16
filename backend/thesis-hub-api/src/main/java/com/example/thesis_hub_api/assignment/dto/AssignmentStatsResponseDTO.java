package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentStatsResponseDTO {

    private Long projectRoundId;
    private int totalStudents;
    private int totalAssigned;
    private int matchedNv1;
    private double nv1Rate;
    private int matchedNv2;
    private double nv2Rate;
    private int matchedNv3;
    private double nv3Rate;
    private int matchedFallback;
    private int unassignedCount;
    private int overriddenCount;
    private int finalizedCount;
    private int totalLecturers;
    private int totalCapacity;
    private double averageLoadRatio;
}
