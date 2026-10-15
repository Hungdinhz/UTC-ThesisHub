package com.example.thesis_hub_api.organization.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResearchInterestsDTO {

    @NotBlank(message = "Hướng nghiên cứu không được để trống")
    private String researchInterests;
}
