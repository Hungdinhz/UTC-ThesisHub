package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicRecordResponseDTO {

    private Long id;
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String className;
    private String majorName;
    private Long projectRoundId;
    private String roundCode;
    private Integer completedCredits;
    private Double gpa;
    private Boolean tuitionDebt;
    private Boolean underDisciplinaryAction;
    private Integer missingPrerequisiteCount;
    private String note;
    private Instant importedAt;
}
