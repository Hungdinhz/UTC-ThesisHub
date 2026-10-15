package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoScheduleRequestDTO {
    private Long projectRoundId;
    private List<Long> councilIds;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> rooms;
    private List<String> sessions; // MORNING, AFTERNOON
    @Builder.Default
    private Integer maxStudentsPerSession = 12;
}
