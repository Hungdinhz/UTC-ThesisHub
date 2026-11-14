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
public class EligibleStudentListResponseDTO {
    private Long roundId;
    private String roundCode;
    private String roundName;
    /** Ngưỡng nợ tín chỉ: nợ phải nhỏ hơn giá trị này mới được nhận đồ án */
    private int maxDebtCredits;
    private int totalStudents;
    private int eligibleCount;
    private int ineligibleCount;
    private int noDataCount;
    private List<EligibleStudentRowDTO> students;
}
