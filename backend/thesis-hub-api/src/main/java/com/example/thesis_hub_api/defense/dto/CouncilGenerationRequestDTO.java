package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouncilGenerationRequestDTO {
    private Long projectRoundId;
    @Builder.Default
    private int maxStudentsPerCouncil = 5;
    private List<CouncilSchedulingRequestDTO.StudentInfo> overrideStudents;
    private List<CouncilSchedulingRequestDTO.LecturerInfo> overrideLecturers;
}
