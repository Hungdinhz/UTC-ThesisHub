package com.example.thesis_hub_api.identity.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
public class CreateUserRequestDTO {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phone;

    private String avatarUrl;

    @NotBlank(message = "Vai trò không được để trống")
    private String roleName; // ROLE_ADMIN, ROLE_STUDENT, ROLE_LECTURER, ROLE_COMMITTEE

    // Student fields if role is ROLE_STUDENT
    private String studentCode;
    private String className;
    private Long majorId;
    private Long trainingProgramId;
    private LocalDate dateOfBirth;
    private String gender;

    // Lecturer fields if role is ROLE_LECTURER / ROLE_COMMITTEE
    private String lecturerCode;
    private Long departmentId;
    private String academicDegree; // THAC_SI, TIEN_SI, PGS, GS, OTHER
    private String researchInterests;
    private Integer maxThesisQuota;
}
