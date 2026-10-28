package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentRoundStatusResponseDTO {
    private boolean hasActiveRound;
    private boolean inRound;
    private Long roundId;
    private String roundCode;
    private String roundName;
    private String roundStatus;
    private Integer roundCurrentStage;
    private Long studentId;
    private String studentCode;
    private String fullName;
    private String status;
    private String note;
    private boolean isDropped;
    private Integer completedStage;
}
