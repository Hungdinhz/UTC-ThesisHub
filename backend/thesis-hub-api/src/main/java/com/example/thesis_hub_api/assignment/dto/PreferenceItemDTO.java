package com.example.thesis_hub_api.assignment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceItemDTO {

    @NotNull(message = "Priority không được để trống")
    @Min(value = 1, message = "Priority tối thiểu là 1")
    @Max(value = 3, message = "Priority tối đa là 3")
    private Integer priority;

    @NotNull(message = "Lecturer ID không được để trống")
    private Long lecturerId;
}
