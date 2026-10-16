package com.example.thesis_hub_api.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDirectionRequestDTO {

    @NotBlank(message = "Mã hướng đồ án không được để trống")
    private String code;

    @NotBlank(message = "Tên hướng đồ án không được để trống")
    private String name;

    private String description;

    private Long departmentId;

    @Builder.Default
    private Boolean isActive = true;
}
