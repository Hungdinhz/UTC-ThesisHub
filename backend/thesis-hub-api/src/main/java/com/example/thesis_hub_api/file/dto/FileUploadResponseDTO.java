package com.example.thesis_hub_api.file.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponseDTO {
    private String fileName;
    private String fileDownloadUri;
    private String fileType;
    private long size;
}
