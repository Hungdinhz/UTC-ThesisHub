package com.example.thesis_hub_api.identity.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
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
public class AdminRegisterRequestDTO {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Mật khẩu xác nhận không được để trống")
    @JsonProperty("confirm_password")
    private String confirmPassword;

    @NotBlank(message = "Họ và tên không được để trống")
    @JsonProperty("full_name")
    private String fullName;

    private String phone;

    @NotBlank(message = "Mã xác nhận bảo mật (Admin API Key) không được để trống")
    @JsonProperty("admin_secret_key")
    private String adminSecretKey;
}
