package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouncilResponseDTO {
    private Long id;
    private Long projectRoundId;
    private String name;
    private String code;
    private String status;
    private String description;
    private List<CouncilMemberDTO> members;
    private List<Long> studentIds;
}
