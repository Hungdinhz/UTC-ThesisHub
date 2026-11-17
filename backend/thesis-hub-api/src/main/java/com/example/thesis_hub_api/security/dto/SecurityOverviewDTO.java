package com.example.thesis_hub_api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityOverviewDTO {
    private int securityScore;
    private String securityPostureLabel;
    private long activeSessionsCount;
    private long failedLogins24h;
    private long lockedAccountsCount;
    private long highSeverityAlertsCount;
    private boolean strongPasswordEnforced;
    private boolean scoreLockAfterCloseEnforced;
    private List<AuditLogResponseDTO> recentAlerts;
}
