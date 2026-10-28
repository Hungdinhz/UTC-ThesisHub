package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DefenseScheduleResponseDTO {
    private Long id;
    private Long councilId;
    private String councilName;
    private String councilCode;
    private Long projectRoundId;
    private LocalDate defenseDate;
    private String session; // MORNING, AFTERNOON
    private String room;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer maxStudents;
    private String status;
    private String notes;
    private java.util.List<CouncilMemberDTO> members;
    private java.util.List<Long> studentIds;
    private java.util.List<CouncilStudentDetailDTO> assignedStudents;
}

