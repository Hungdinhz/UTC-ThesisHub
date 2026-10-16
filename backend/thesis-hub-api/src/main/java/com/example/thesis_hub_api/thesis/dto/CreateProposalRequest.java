package com.example.thesis_hub_api.thesis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProposalRequest {

    @NotNull(message = "projectRoundId không được để trống")
    private Long projectRoundId;

    @NotNull(message = "studentId không được để trống")
    private Long studentId;

    @NotNull(message = "lecturerId không được để trống")
    private Long lecturerId;

    @NotBlank(message = "Tên đề tài tiếng Việt không được để trống")
    @Size(max = 500, message = "Tên đề tài tối đa 500 ký tự")
    private String titleVn;

    @Size(max = 500, message = "Tên đề tài tiếng Anh tối đa 500 ký tự")
    private String titleEn;

    private String description;
    private String objectives;
    private String expectedResults;
    private String researchContent;
    private String fileUrl;
}
