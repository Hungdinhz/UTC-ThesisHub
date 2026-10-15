package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneResponseDTO {

    private Long milestoneId;
    private Long roundId;
    private String name;
    private String phaseType;
    private Instant startDate;
    private Instant endDate;
    private String description;
    private Integer orderIndex;
    private Boolean isActive; // true nếu Instant.now() nằm trong khoảng [startDate, endDate]
}
