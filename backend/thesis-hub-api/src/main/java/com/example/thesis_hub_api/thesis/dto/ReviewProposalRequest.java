package com.example.thesis_hub_api.thesis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewProposalRequest {

    @NotNull(message = "reviewGroupId không được để trống")
    private Long reviewGroupId;

    /**
     * Decision status: APPROVED, REVISE_REQUIRED, REJECTED
     */
    @NotBlank(message = "Trạng thái đánh giá không được để trống")
    private String status;

    private String evaluationNotes;
}
