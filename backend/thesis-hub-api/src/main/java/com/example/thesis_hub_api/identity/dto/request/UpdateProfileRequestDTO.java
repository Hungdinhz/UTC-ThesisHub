package com.example.thesis_hub_api.identity.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDTO {

    private String fullName;

    private String phone;

    private String avatarUrl;

    // Student profile updates
    private LocalDate dateOfBirth;

    private String gender;

    // Lecturer profile updates
    private String researchInterests;

    @JsonProperty("research_interest")
    private String researchInterestSnake;

    private String academicBackground;

    @JsonProperty("academic_background")
    private String academicBackgroundSnake;

    public String getActualResearchInterests() {
        return researchInterests != null ? researchInterests : researchInterestSnake;
    }
}
