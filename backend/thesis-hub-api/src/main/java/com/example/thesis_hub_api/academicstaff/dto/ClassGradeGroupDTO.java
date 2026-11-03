package com.example.thesis_hub_api.academicstaff.dto;

import com.example.thesis_hub_api.defense.dto.GraduationResultResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassGradeGroupDTO {
    private String className;
    private int totalStudents;
    private int passedCount;
    private int failedCount;
    /** Điểm tổng kết trung bình của lớp (null nếu chưa có điểm) */
    private Double averageScore;
    private List<GraduationResultResponseDTO> rows;
}
