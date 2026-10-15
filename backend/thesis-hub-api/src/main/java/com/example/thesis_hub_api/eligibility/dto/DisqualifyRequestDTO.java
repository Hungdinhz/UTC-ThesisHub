package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisqualifyRequestDTO {
    private Long studentId;
    private Long projectRoundId;
    private Long disqualifiedBy;
    private String reason;
}
