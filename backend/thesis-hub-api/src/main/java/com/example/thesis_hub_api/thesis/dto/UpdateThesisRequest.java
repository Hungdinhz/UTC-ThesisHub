package com.example.thesis_hub_api.thesis.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateThesisRequest {

    @Size(max = 500, message = "Tên đề tài tiếng Việt tối đa 500 ký tự")
    private String titleVn;

    @Size(max = 500, message = "Tên đề tài tiếng Anh tối đa 500 ký tự")
    private String titleEn;

    private String description;
    private String objectives;
    private String scope;
    private String technologies;
    private String status;

    @DecimalMin(value = "0.00", message = "Tiến độ tối thiểu là 0%")
    @DecimalMax(value = "100.00", message = "Tiến độ tối đa là 100%")
    private BigDecimal completionRate;

    private Boolean defenseEligible;
}
