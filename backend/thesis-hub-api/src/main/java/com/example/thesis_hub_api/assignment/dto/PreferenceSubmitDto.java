package com.example.thesis_hub_api.assignment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceSubmitDto {
    
    @NotNull(message = "projectDirectionId is required")
    private Integer projectDirectionId;

    @NotNull(message = "preferences list is required")
    @Size(min = 3, max = 3, message = "must have exactly 3 preferences")
    @Valid
    private List<PreferenceItemDto> preferences;

    private String extraCriteria;
}
