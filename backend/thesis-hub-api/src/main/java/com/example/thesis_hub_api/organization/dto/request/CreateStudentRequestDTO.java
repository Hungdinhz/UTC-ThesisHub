package com.example.thesis_hub_api.organization.dto.request;

import jakarta.validation.constraints.Email;
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
public class CreateStudentRequestDTO {

    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phone;

    @NotBlank(message = "Mã sinh viên không được để trống")
    @Size(max = 50, message = "Mã sinh viên tối đa 50 ký tự")
    private String studentCode;

    private String className;

    @NotNull(message = "Ngành đào tạo không được để trống")
    private Long majorId;

    @NotNull(message = "Chương trình đào tạo không được để trống")
    private Long trainingProgramId;

    private LocalDate dateOfBirth;

    private String gender;

    @Builder.Default
    private Integer debtCredits = 0;
}