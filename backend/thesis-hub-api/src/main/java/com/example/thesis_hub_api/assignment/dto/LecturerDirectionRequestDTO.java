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
public class LecturerDirectionRequestDTO {

    @NotNull(message = "Lecturer ID không được để trống")
    private Long lecturerId;

    @NotNull(message = "Direction ID không được để trống")
    private Long directionId;

    @Builder.Default
    private Boolean isPrimary = false;

    private String note;
}
