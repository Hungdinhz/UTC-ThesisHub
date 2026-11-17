package com.example.thesis_hub_api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RbacPermissionItemDTO {
    private String module;
    private String permissionName;
    private String description;
    private Map<String, Boolean> roleAccess; // ROLE_ADMIN, ROLE_ACADEMIC_STAFF, ROLE_LECTURER, ROLE_COMMITTEE, ROLE_STUDENT
}
