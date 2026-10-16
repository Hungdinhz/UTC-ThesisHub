package com.example.thesis_hub_api.assignment.algorithm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerAssignmentInput {

    private Long lecturerId;
    private String lecturerCode;
    private String fullName;
    private String academicDegree; // "THAC_SI", "TIEN_SI", "PGS", "GS"
    private int maxQuota;
    private double capacityFactor;
    private int effectiveCapacity;
    private int currentAssigned;

    @Builder.Default
    private List<Long> directionIds = new ArrayList<>();

    public int getRemainingCapacity() {
        return Math.max(0, effectiveCapacity - currentAssigned);
    }

    public double getLoadRatio() {
        if (effectiveCapacity <= 0) return 1.0;
        return (double) currentAssigned / (double) effectiveCapacity;
    }
}
