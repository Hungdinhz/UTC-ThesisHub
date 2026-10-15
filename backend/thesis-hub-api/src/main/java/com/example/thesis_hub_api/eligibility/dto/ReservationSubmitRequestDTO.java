package com.example.thesis_hub_api.eligibility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationSubmitRequestDTO {
    private Long studentId;
    private Long thesisId;
    private Long projectRoundId;
    private String reason;
    private String note;
}
