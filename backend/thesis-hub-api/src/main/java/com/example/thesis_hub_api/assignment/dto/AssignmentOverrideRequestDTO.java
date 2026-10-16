package com.example.thesis_hub_api.assignment.dto;

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
public class AssignmentOverrideRequestDTO {

    @NotNull(message = "Lecturer ID mới không được để trống")
    private Long newLecturerId;

    @NotBlank(message = "Lý do điều chỉnh (override) không được để trống")
    private String reason;
}
