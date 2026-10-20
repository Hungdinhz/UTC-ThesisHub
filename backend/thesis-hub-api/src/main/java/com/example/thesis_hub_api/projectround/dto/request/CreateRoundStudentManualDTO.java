package com.example.thesis_hub_api.projectround.dto.request;

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
public class CreateRoundStudentManualDTO {

    @NotBlank(message = "Mã sinh viên không được để trống")
    private String studentCode;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String email;

    private String className;

    @NotNull(message = "Ngành đào tạo không được để trống")
    private Long majorId;

    private String phone;

    @Builder.Default
    private String status = "ELIGIBLE";

    private String note;
}