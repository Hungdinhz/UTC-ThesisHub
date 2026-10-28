package com.example.thesis_hub_api.thesis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalResponse {
    private Long id;
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
    private String titleVn;
    private String titleEn;
    private String description;
    private String objectives;
    private String expectedResults;
    private String researchContent;
    private String fileUrl;
    private String status;
    private Boolean supervisorApproved;
    private String supervisorComment;
    private Integer version;
    private Instant submittedAt;
    private Boolean studentSigned;
    private Instant studentSignedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
