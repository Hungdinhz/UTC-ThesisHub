package com.example.thesis_hub_api.organization.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingProgramResponseDTO {

    private Long id;
    private String code;
    private String name;
    private BigDecimal durationYears;
    private Integer totalCredits;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
