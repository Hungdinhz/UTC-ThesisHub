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
public class AuditLogStatsDTO {
    private long totalLogs;
    private long todayLogs;
    private long highSeverityLogs;
    private long failedOrBlockedLogs;
    private Map<String, Long> moduleBreakdown;
}
