package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThesisResponseDTO {
    private Long id;
    private Long projectRoundId;
    private Long studentId;
    private String studentName;
    private Long lecturerId;
    private String lecturerName;
    private String title;
    private String englishTitle;
    private String description;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
