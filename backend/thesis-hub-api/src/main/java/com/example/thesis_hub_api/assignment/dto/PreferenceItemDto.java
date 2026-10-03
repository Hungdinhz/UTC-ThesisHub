package com.example.thesis_hub_api.assignment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceItemDto {
    
    @NotNull(message = "lecturerId is required")
    private Integer lecturerId;

    @NotNull(message = "priorityOrder is required")
    @Min(value = 1, message = "priorityOrder must be between 1 and 3")
    @Max(value = 3, message = "priorityOrder must be between 1 and 3")
    private Integer priorityOrder;
}
