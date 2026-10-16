package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDirectionResponseDTO {

    private Long id;
    private String code;
    private String name;
    private String description;
    private Long departmentId;
    private String departmentName;
    private Boolean isActive;
    private int lecturerCount;
    private Instant createdAt;
    private Instant updatedAt;
}
