package com.example.thesis_hub_api.organization.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MajorRequestDTO {

    private Long facultyId;

    private Long departmentId;

    @NotBlank(message = "Mã ngành không được để trống")
    @Size(max = 50, message = "Mã ngành tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên ngành không được để trống")
    @Size(max = 255, message = "Tên ngành tối đa 255 ký tự")
    private String name;

    private String description;
}
