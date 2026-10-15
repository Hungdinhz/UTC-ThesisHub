package com.example.thesis_hub_api.progress.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class CreateProgressReportRequest {

    @NotNull(message = "studentId không được để trống")
    private Long studentId;

    private Long milestoneId;

    @NotBlank(message = "Tiêu đề báo cáo không được để trống")
    private String reportTitle;

    @NotBlank(message = "Công việc đã hoàn thành không được để trống")
    private String completedWork;

    @NotBlank(message = "Kế hoạch giai đoạn tới không được để trống")
    private String plannedWork;

    private String difficulties;

    @Min(value = 0, message = "Tiến độ tự đánh giá tối thiểu 0%")
    @Max(value = 100, message = "Tiến độ tự đánh giá tối đa 100%")
    @Builder.Default
    private Integer progressPercent = 0;

    private String fileUrl;
}
