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
    private Double supervisorWeight = 0.3;
    @Builder.Default
    private Double reviewerWeight = 0.2;
    @Builder.Default
    private Double councilWeight = 0.5;
    private String notes;
}
