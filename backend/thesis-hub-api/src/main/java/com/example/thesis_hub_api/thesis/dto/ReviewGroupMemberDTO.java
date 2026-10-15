package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewGroupMemberDTO {
    private Long id;
    private Long lecturerId;
    private String lecturerName;
    private String role;
}
