package com.example.thesis_hub_api.assignment.algorithm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAssignmentInput {

    private Long studentId;
    private String studentCode;
    private String fullName;
    private String trainingProgramCode; // "CU_NHAN" or "KY_SU"
    private Long directionId;
    private Double gpa;

    @Builder.Default
    private List<PreferenceEntry> preferences = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreferenceEntry {
        private int priority; // 1, 2, 3
        private Long lecturerId;
    }
}
