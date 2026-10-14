package com.example.thesis_hub_api.organization.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class TrainingProgramRequestDTO {

    @NotBlank(message = "Mã chương trình đào tạo không được để trống")
    @Size(max = 50, message = "Mã chương trình đào tạo tối đa 50 ký tự")
    private String code; // CU_NHAN, KY_SU

    @NotBlank(message = "Tên chương trình đào tạo không được để trống")
    @Size(max = 100, message = "Tên chương trình đào tạo tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Thời gian đào tạo không được để trống")
    @DecimalMin(value = "1.0", message = "Thời gian đào tạo tối thiểu 1.0 năm")
    private BigDecimal durationYears;

    private Integer totalCredits;

    private String description;
}
