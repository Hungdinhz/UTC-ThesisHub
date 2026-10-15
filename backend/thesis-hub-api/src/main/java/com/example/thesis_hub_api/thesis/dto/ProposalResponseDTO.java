package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposalResponseDTO {
    private Long id;
    private Long thesisId;
    private String title;
    private String content;
    private String fileUrl;
    private String status;
    private Integer version;
    private Instant submittedAt;
    private Instant createdAt;
}
