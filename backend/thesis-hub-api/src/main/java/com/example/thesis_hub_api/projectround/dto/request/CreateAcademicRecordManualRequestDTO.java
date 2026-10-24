package com.example.thesis_hub_api.projectround.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAcademicRecordManualRequestDTO {

    private Long studentId;

    private String studentCode;

    @NotNull(message = "Số tín chỉ tích lũy không được để trống")
    @Min(value = 0, message = "Số tín chỉ tích lũy phải >= 0")
    private Integer completedCredits;

    @NotNull(message = "Điểm trung bình tích lũy GPA không được để trống")
    @DecimalMin(value = "0.0", message = "GPA phải từ 0.0 đến 4.0")
    @DecimalMax(value = "4.0", message = "GPA phải từ 0.0 đến 4.0")
    private Double gpa;

    @Builder.Default
    private Boolean tuitionDebt = false;

    @Builder.Default
    private Boolean underDisciplinaryAction = false;

    @Builder.Default
    @Min(value = 0, message = "Số môn tiên quyết còn thiếu phải >= 0")
    private Integer missingPrerequisiteCount = 0;

    private String note;
}
