package com.example.thesis_hub_api.assignment.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class LecturerCapacityRequest {
    private Integer lecturerId;
    private Integer projectRoundId;
    private Integer baseQuota;
    private BigDecimal capacityCoefficient;
}
