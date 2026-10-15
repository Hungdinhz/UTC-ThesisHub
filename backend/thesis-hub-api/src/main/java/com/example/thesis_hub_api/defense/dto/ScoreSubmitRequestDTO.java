package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreSubmitRequestDTO {
    private Long thesisId;
    private Long graderId;
    /**
     * Score type: SUPERVISOR, REVIEWER, COUNCIL
     */
    private String scoreType;
    private BigDecimal score;
    private String feedback;
}
