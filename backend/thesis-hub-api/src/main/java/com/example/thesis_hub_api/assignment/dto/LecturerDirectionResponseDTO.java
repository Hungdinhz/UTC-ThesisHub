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
public class LecturerDirectionResponseDTO {

    private Long id;
    private Long lecturerId;
    private String lecturerCode;
    private String lecturerName;
    private String academicDegree;
    private Long directionId;
    private String directionCode;
    private String directionName;
    private Boolean isPrimary;
    private String note;
    private Instant createdAt;
}
