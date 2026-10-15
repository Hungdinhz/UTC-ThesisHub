package com.example.thesis_hub_api.progress.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSubmissionRequest {

    /**
     * Decision: ACCEPTED, REVISE_REQUIRED, REJECTED
     */
    @NotBlank(message = "Trạng thái đánh giá không được để trống")
    private String status;

    private String reviewFeedback;
}
