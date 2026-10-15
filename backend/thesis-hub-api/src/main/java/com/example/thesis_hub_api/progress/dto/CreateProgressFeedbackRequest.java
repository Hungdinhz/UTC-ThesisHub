package com.example.thesis_hub_api.progress.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProgressFeedbackRequest {

    @NotNull(message = "lecturerId không được để trống")
    private Long lecturerId;

    @NotBlank(message = "Nội dung nhận xét không được để trống")
    private String feedbackContent;

    /**
     * Rating: DAT, KHONG_DAT, XUAT_SAC, CAN_CO_GANG
     */
    @NotBlank(message = "Đánh giá xếp loại không được để trống")
    private String assessment;

    @DecimalMin(value = "0.00", message = "Tiến độ xác nhận tối thiểu 0%")
    @DecimalMax(value = "100.00", message = "Tiến độ xác nhận tối đa 100%")
    private BigDecimal confirmedCompletionRate;
}
