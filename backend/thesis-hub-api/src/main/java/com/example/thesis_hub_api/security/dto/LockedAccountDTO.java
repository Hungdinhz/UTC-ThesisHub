package com.example.thesis_hub_api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LockedAccountDTO {
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String roleName;
    private Boolean isActive;
    private Integer failedLoginAttempts;
    private Instant lockedUntil;
    private Instant lastLoginAt;
    private String lastLoginIp;
    private String lockState; // TEMP_LOCKED, PERMANENT_LOCKED, WARNING_ATTEMPTS
}
