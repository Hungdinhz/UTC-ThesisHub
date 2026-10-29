package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SynthesizeResultRequestDTO {
    private Long thesisId;
    @Builder.Default
    private Double supervisorWeight = 0.4;
    @Builder.Default
    private Double reviewerWeight = 0.0;
    @Builder.Default
    private Double councilWeight = 0.6;
    private String notes;
}
