package com.example.thesis_hub_api.thesis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadDTO {
    private Long thesisId;
    private String docType;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private Long uploadedBy;
}
