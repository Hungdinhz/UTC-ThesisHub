package com.example.thesis_hub_api.assignment.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CapacityUpdateRequestDTO {

    @Min(value = 0, message = "Chỉ tiêu không được âm")
    private Integer maxQuota;

    @Min(value = 0, message = "Hệ số capacity không được âm")
    private Double capacityFactor;

    private Boolean isActive;

    private String note;

    private java.util.List<Long> directionIds;
}
