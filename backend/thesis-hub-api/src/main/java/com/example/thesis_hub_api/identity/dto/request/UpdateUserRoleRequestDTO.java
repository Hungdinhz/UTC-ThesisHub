package com.example.thesis_hub_api.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequestDTO {

    private Long roleId;

    @NotBlank(message = "Tên vai trò không được để trống")
    private String roleName; // ROLE_ADMIN, ROLE_STUDENT, ROLE_LECTURER, ROLE_COMMITTEE
}
