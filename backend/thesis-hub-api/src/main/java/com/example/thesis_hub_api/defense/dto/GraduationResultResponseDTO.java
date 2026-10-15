package com.example.thesis_hub_api.defense.dto;

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
public class GraduationResultResponseDTO {
    private Long id;
    private Long thesisId;
    private BigDecimal supervisorScore;
    private BigDecimal reviewerScore;
    private BigDecimal councilScore;
    private BigDecimal finalScore;
    private String grade;
    private String finalResult; // PASSED, FAILED
    private Instant publishedAt;
    private String notes;
}
