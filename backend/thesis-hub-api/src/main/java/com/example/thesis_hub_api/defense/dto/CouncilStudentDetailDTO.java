package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouncilStudentDetailDTO {
    private Long studentId;
    private String studentName;
    private String studentCode;
    private Long thesisId;
    private String thesisTitle;
    private Long advisorId;
    private String advisorName;
}
