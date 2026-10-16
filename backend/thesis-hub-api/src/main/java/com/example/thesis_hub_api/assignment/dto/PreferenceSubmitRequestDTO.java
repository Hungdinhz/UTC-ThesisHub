package com.example.thesis_hub_api.assignment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceSubmitRequestDTO {

    @NotNull(message = "Project round ID không được để trống")
    private Long projectRoundId;

    private Long studentId; // Taken from JWT or provided by admin

    private Double gpa;

    private String prioritizationCriteria; // e.g. skill keywords, certifications, desired topic notes

    @NotEmpty(message = "Danh sách nguyện vọng không được rỗng")
    @Size(max = 3, message = "Tối đa 3 nguyện vọng")
    @Valid
    private List<PreferenceItemDTO> preferences;
}
