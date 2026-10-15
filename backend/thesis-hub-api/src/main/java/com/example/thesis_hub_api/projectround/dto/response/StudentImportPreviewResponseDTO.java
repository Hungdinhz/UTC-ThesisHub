package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportPreviewResponseDTO {

    private Long roundId;
    private String roundCode;
    private String roundName;
    private int totalRows;
    private int validRows;
    private int errorRows;
    private List<StudentImportRowDTO> rows;
}
