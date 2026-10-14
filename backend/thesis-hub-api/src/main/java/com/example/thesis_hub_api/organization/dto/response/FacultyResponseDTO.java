package com.example.thesis_hub_api.organization.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyResponseDTO {

    private Long id;
    private String code;
    private String name;
    private String description;
    private int departmentCount;
    private Instant createdAt;
    private Instant updatedAt;
}
