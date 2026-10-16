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
public class AssignmentGenerateRequestDTO {

    @NotNull(message = "Project round ID không được để trống")
    private Long projectRoundId;

    @Builder.Default
    private Boolean reassignAll = true; // Clear previous proposed assignments if true
}
