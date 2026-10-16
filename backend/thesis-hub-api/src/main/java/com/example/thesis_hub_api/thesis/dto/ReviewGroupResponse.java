package com.example.thesis_hub_api.thesis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewGroupResponse {
    private Long id;
    private Long projectRoundId;
    private String projectRoundName;
    private Long departmentId;
    private String departmentName;
    private String code;
    private String name;
    private String description;
    private String status;
    private List<MemberDto> members;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberDto {
        private Long id;
        private Long lecturerId;
        private String lecturerCode;
        private String lecturerFullName;
        private String academicDegree;
        private String role;
    }
}
