package com.example.thesis_hub_api.defense.dto;

import lombok.Data;

import java.util.List;

@Data
public class CouncilSchedulingResultDTO {
    private List<CouncilResult> councils;
    private List<String> unassignedStudentIds;
    private String errorMessage;

    @Data
    public static class CouncilResult {
        private List<String> studentIds;
        private String presidentId;
        private String secretaryId;
        private String reviewer1Id;
        private String reviewer2Id;
        private String memberId;
    }
}
