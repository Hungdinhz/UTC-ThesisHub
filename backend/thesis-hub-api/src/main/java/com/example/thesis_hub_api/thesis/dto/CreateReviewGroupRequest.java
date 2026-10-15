package com.example.thesis_hub_api.thesis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewGroupRequest {

    @NotNull(message = "projectRoundId không được để trống")
    private Long projectRoundId;

    private Long departmentId;

    @NotBlank(message = "Mã nhóm xét duyệt không được để trống")
    private String code;

    @NotBlank(message = "Tên nhóm xét duyệt không được để trống")
    private String name;

    private String description;

    private List<MemberAssignmentDto> members;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberAssignmentDto {
        @NotNull(message = "lecturerId không được để trống")
        private Long lecturerId;
        private String role; // LEADER, SECRETARY, MEMBER
    }
}
