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
public class ScheduleConfigDTO {
    private Long councilId;
    private LocalDate defenseDate;
    private String session; // MORNING, AFTERNOON
    private String room;
    private LocalTime startTime;
    private LocalTime endTime;
    @Builder.Default
    private Integer maxStudents = 12;
    private String notes;
}
