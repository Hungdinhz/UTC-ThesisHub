package com.example.thesis_hub_api.projectround.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRoundRequestDTO {

    @NotBlank(message = "Mã đợt đồ án không được để trống")
    @Size(max = 100, message = "Mã đợt đồ án tối đa 100 ký tự")
    private String roundCode;

    @NotBlank(message = "Tên đợt đồ án không được để trống")
    @Size(max = 255, message = "Tên đợt đồ án tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Năm học không được để trống")
    @Size(max = 50, message = "Năm học tối đa 50 ký tự")
    private String academicYear; // Ví dụ: "2026-2027"

    @NotBlank(message = "Học kỳ không được để trống")
    @Size(max = 20, message = "Học kỳ tối đa 20 ký tự")
    private String semester; // Ví dụ: "HK1" hoặc "HK2"

    @NotNull(message = "Chương trình đào tạo áp dụng không được để trống")
    private Long trainingProgramId;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;
}
