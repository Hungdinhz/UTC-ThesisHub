package com.example.thesis_hub_api.assignment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDirectionDto {
    private Integer id;
    private String name;
    private String description;
    private Integer projectRoundId;
}
