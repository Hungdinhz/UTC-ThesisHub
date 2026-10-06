package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalCreateDTO {
    private Long thesisId;
    private String title;
    private String content;
    private String fileUrl;
}
