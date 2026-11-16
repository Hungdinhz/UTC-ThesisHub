package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentNotifyRequestDTO {
    private Long projectRoundId;
    private String title;
    private String message;
    private Boolean notifyLecturers;
    private Boolean notifyStudents;
    private Boolean sendEmail;
}
