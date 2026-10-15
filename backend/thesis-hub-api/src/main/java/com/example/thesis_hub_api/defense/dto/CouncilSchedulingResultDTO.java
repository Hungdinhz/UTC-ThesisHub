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
        private String secretary1Id;
        private String secretary2Id;
        private String member1Id;
        private String member2Id;
    }
}
