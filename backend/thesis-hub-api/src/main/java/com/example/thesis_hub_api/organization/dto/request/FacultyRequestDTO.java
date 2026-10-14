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
public class FacultyRequestDTO {

    @NotBlank(message = "Mã khoa không được để trống")
    @Size(max = 50, message = "Mã khoa tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên khoa không được để trống")
    @Size(max = 255, message = "Tên khoa tối đa 255 ký tự")
    private String name;

    private String description;
}
