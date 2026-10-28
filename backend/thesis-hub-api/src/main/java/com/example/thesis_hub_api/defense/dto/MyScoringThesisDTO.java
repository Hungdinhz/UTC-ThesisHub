package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyScoringThesisDTO {
    private Long thesisId;
    private String thesisCode;
    private String titleVn;
    private Long projectRoundId;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String studentClass;
    private Long advisorId;
    private String advisorName;
    private Long reviewerId;
    private String reviewerName;
    private Long councilId;
    private String councilCode;
    private String councilName;
    private Boolean defenseEligible;
    private String status;
    private Boolean canScoreSupervisor;
    private Boolean canScoreReviewer;
    private Boolean canScoreCouncil;
    private Boolean isCouncilMember;
    private String myCouncilRole;
    private Long myLecturerId;
    private String myLecturerName;
    private String myLecturerDegree;
}
