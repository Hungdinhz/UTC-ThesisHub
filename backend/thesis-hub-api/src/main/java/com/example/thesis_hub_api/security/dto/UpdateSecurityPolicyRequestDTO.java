package com.example.thesis_hub_api.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSecurityPolicyRequestDTO {
    @NotBlank(message = "Giá trị cấu hình không được để trống")
    private String policyValue;
}
