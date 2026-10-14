package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRoundResponseDTO {

    private Long roundId;
    private String roundCode;
    private String name;
    private String academicYear;
    private String semester;
    private Long trainingProgramId;
    private String trainingProgram; // Mã chương trình, ví dụ "CU_NHAN", "KY_SU" (Contract 2)
    private String trainingProgramName;
    private String status; // DRAFT, OPEN, IN_PROGRESS, CLOSED, ARCHIVED
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private List<MilestoneResponseDTO> milestones;
    private MilestoneResponseDTO currentMilestone;
    private Instant createdAt;
    private Instant updatedAt;
}
