package com.example.thesis_hub_api.defense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouncilMemberDTO {
    private Long id;
    private Long lecturerId;
    private String lecturerName;
    private String role; // PRESIDENT, SECRETARY, MEMBER
    private Boolean confirmed;
}
