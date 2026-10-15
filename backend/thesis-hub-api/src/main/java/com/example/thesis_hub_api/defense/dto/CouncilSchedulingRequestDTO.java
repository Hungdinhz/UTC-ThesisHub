package com.example.thesis_hub_api.defense.dto;

import lombok.Data;

import java.util.List;

@Data
public class CouncilSchedulingRequestDTO {
    private List<StudentInfo> students;
    private List<LecturerInfo> lecturers;
    private int maxStudentsPerCouncil = 5;

    @Data
    public static class StudentInfo {
        private String studentId;
        private String thesisId;
        private String advisorId;
        private String reviewerId; // GVPB
    }

    @Data
    public static class LecturerInfo {
        private String lecturerId;
        private boolean isPresidentEligible;
        private boolean isSecretaryEligible;
        private boolean isMemberEligible;
        private int currentLoad;
    }
}
