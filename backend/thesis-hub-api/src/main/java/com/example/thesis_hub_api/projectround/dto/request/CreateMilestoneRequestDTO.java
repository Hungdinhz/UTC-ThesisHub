package com.example.thesis_hub_api.projectround.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMilestoneRequestDTO {

    @NotBlank(message = "Tên mốc thời gian không được để trống")
    @Size(max = 255, message = "Tên mốc thời gian tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Loại giai đoạn không được để trống")
    @Size(max = 100, message = "Loại giai đoạn tối đa 100 ký tự")
    private String phaseType; // REGISTRATION, PROPOSAL_SUBMISSION, WEEKLY_REPORT, ELIGIBILITY_REVIEW, COMMITTEE_ASSIGNMENT, DEFENSE

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private Instant startDate;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private Instant endDate;

    private String description;

    @Builder.Default
    private Integer orderIndex = 0;
}
