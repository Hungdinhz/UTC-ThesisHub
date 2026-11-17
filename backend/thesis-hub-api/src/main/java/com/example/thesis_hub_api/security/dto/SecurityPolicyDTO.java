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
public class SecurityPolicyDTO {
    private Long id;
    private String policyKey;
    private String policyName;
    private String policyValue;
    private String valueType;
    private String category;
    private String description;
    private Long updatedBy;
    private Instant updatedAt;
}
