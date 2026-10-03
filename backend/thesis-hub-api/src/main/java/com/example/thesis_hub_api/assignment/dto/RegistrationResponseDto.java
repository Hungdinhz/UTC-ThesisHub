package com.example.thesis_hub_api.assignment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationResponseDto {
    private Integer id;
    private Integer studentId;
    private Integer projectDirectionId;
    private String status;
    private List<PreferenceItemDto> preferences;
    private String extraCriteria;
}
