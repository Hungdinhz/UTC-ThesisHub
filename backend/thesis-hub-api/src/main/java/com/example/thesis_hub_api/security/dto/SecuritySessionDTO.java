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
public class SecuritySessionDTO {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String roleName;
    private String ipAddress;
    private String deviceInfo;
    private String userAgent;
    private String status;
    private Instant issuedAt;
    private Instant lastActivityAt;
    private Instant expiresAt;
    private Instant revokedAt;
    private String revokeReason;
}
