package com.example.thesis_hub_api.projectround.dto.request;

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
public class UpdateProjectRoundRequestDTO {

    @Size(max = 255, message = "Tên đợt đồ án tối đa 255 ký tự")
    private String name;

    @Size(max = 50, message = "Năm học tối đa 50 ký tự")
    private String academicYear;

    @Size(max = 20, message = "Học kỳ tối đa 20 ký tự")
    private String semester;

    private Long trainingProgramId;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;
}
