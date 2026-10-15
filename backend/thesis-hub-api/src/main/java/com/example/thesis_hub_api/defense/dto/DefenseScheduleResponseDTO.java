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
    private LocalDate defenseDate;
    private String session; // MORNING, AFTERNOON
    private String room;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer maxStudents;
    private String status;
    private String notes;
}
