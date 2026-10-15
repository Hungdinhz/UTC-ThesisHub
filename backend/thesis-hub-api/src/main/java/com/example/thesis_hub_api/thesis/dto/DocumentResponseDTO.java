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
public class DocumentResponseDTO {
    private Long id;
    private Long thesisId;
    private String docType;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private Long uploadedBy;
    private String uploadedByName;
    private Integer version;
    private String status;
    private Instant createdAt;
}
