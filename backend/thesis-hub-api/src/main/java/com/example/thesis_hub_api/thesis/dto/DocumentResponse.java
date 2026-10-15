package com.example.thesis_hub_api.thesis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private Long thesisId;
    private Long uploaderId;
    private String uploaderFullName;
    private String name;
    private String documentType;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private Integer version;
    private Boolean isLatest;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
