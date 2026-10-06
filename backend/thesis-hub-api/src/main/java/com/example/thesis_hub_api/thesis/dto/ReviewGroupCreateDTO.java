package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewGroupCreateDTO {
    private Long projectRoundId;
    private String name;
    private String description;
    private List<Long> lecturerIds;
}
