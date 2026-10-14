package com.example.thesis_hub_api.projectround.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicRecordImportResultResponseDTO {

    private int totalProcessed;
    private int recordsCreated;
    private int recordsUpdated;
    private int skipped;
    @Builder.Default
    private List<String> messages = new ArrayList<>();
}
