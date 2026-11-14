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

    private Double gpa;

    private Integer completedCredits;

    private Integer debtCredits;

    private Boolean tuitionDebt;

    private Boolean underDisciplinaryAction;

    private Integer missingPrerequisiteCount;

    @Builder.Default
    private String status = "ELIGIBLE";

    private String note;

    /**
     * Tùy chọn cấp mật khẩu mặc định cho tài khoản sinh viên mới:
     * - PHONE: Số điện thoại (mặc định; nếu thiếu SĐT sẽ tự dùng Mã SV)
     * - STUDENT_CODE: Mã sinh viên (MSSV)
     */
    @Builder.Default
    private String passwordMode = "PHONE";
}
