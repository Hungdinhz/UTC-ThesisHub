package com.example.thesis_hub_api.organization.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequestDTO {

    @NotNull(message = "ID khoa không được để trống")
    private Long facultyId;

    @NotBlank(message = "Mã bộ môn không được để trống")
    @Size(max = 50, message = "Mã bộ môn tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên bộ môn không được để trống")
    @Size(max = 255, message = "Tên bộ môn tối đa 255 ký tự")
    private String name;

    private String description;
}
