package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewGroupResponseDTO {
    private Long id;
    private Long projectRoundId;
    private String name;
    private String description;
    private String status;
    private List<ReviewGroupMemberDTO> members;
}
