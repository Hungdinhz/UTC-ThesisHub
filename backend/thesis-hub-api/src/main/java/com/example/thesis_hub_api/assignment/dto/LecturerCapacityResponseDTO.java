package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerCapacityResponseDTO {

    private Long id;
    private Long lecturerId;
    private String lecturerCode;
    private String fullName;
    private String email;
    private String phone;
    private String academicDegree;
    private Long departmentId;
    private String departmentName;
    private Long projectRoundId;
    private Integer maxQuota;
    private Double capacityFactor;
    private Integer effectiveCapacity;
    private Integer currentAssigned;
    private Integer remainingCapacity;
    private Double loadRatio;
    private Boolean isActive;
    private String note;
    private List<String> directionNames;
    private List<Long> directionIds;
    private List<String> directionCodes;
}
