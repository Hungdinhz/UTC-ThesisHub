package com.example.thesis_hub_api.academicstaff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassGradeReportResponseDTO {
    private Long roundId;
    private String roundCode;
    private String roundName;
    private String roundStatus;
    private int totalStudents;
    private List<ClassGradeGroupDTO> classes;
}
