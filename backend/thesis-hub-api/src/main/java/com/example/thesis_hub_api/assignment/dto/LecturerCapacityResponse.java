package com.example.thesis_hub_api.assignment.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerCapacityResponse {
    private Integer id;
    private Integer lecturerId;
    private Integer projectRoundId;
    private Integer baseQuota;
    private BigDecimal capacityCoefficient;
    private Integer effectiveCapacity;
    private Integer assignedCount;
    private Integer remainingCapacity;
}
