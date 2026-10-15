package com.example.thesis_hub_api.thesis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThesisResponse {
    private Long id;
    private Long proposalId;
    private Long projectRoundId;
    private String projectRoundName;
    private Long studentId;
    private String studentCode;
    private String studentFullName;
    private String studentClass;
    private Long lecturerId;
    private String lecturerCode;
    private String lecturerFullName;
    private String lecturerDegree;
    private String thesisCode;
    private String titleVn;
    private String titleEn;
    private String description;
    private String objectives;
    private String scope;
    private String technologies;
    private String status;
    private BigDecimal completionRate;
    private Boolean defenseEligible;
    private Instant createdAt;
    private Instant updatedAt;
}
