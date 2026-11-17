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
public class AuditLogResponseDTO {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String actorFullName;
    private String actorRole;
    private String actionType;
    private String moduleName;
    private String targetEntity;
    private String targetId;
    private String summary;
    private String oldValues;
    private String newValues;
    private String requestMethod;
    private String requestUri;
    private String ipAddress;
    private String userAgent;
    private String severity;
    private String status;
    private String errorMessage;
    private Long executionTimeMs;
    private Instant createdAt;
}
