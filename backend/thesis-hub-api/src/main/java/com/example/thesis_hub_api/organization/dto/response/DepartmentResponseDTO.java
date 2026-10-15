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
public class DepartmentResponseDTO {

    private Long id;
    private Long facultyId;
    private String facultyName;
    private String code;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
