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
public class ScoreResponseDTO {
    private Long id;
    private Long thesisId;
    private Long graderId;
    private String scoreType;
    private BigDecimal score;
    private String feedback;
    private Instant gradedAt;
}
