package com.example.thesis_hub_api.thesis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDocumentRequest {

    @NotBlank(message = "Tên tài liệu không được để trống")
    private String name;

    @NotBlank(message = "Loại tài liệu không được để trống")
    private String documentType; // PROPOSAL, INTERIM_REPORT, FINAL_REPORT, SOURCE_CODE, PRESENTATION_SLIDE, DEFENSE_MINUTES, OTHER

    @NotBlank(message = "Đường dẫn file không được để trống")
    private String fileUrl;

    private Long fileSize;
    private String mimeType;
    private String description;
}
