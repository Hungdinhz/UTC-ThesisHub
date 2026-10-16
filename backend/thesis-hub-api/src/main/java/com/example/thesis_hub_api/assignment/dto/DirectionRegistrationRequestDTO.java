package com.example.thesis_hub_api.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectionRegistrationRequestDTO {

    @NotNull(message = "Project round ID không được để trống")
    private Long projectRoundId;

    @NotNull(message = "Direction ID không được để trống")
    private Long directionId;

    private Long studentId; // If admin registers on behalf, otherwise taken from token

    private String note;
}
