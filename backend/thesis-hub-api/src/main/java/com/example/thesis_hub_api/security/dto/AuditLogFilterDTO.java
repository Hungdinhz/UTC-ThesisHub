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
public class AuditLogFilterDTO {
    private String keyword;
    private String moduleName;
    private String actionType;
    private String severity;
    private String status;
    private String actorRole;
    private Instant fromDate;
    private Instant toDate;
}
