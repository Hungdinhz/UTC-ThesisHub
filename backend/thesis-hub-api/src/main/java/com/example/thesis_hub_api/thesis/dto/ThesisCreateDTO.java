package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThesisCreateDTO {
    private Long projectRoundId;
    private Long studentId;
    private Long lecturerId;
    private String title;
    private String englishTitle;
    private String description;
}
