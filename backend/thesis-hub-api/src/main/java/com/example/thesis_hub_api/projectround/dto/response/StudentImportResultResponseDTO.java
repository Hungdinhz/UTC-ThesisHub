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
public class StudentImportResultResponseDTO {

    private int totalProcessed;
    private int newUsersCreated;
    private int newStudentsCreated;
    private int enrolledInRound;
    private int skipped;
    @Builder.Default
    private List<String> messages = new ArrayList<>();
}
