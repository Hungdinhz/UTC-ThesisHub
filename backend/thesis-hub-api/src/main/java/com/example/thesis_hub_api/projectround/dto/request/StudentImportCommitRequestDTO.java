package com.example.thesis_hub_api.projectround.dto.request;

import com.example.thesis_hub_api.projectround.dto.response.StudentImportRowDTO;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportCommitRequestDTO {

    @NotEmpty(message = "Danh sách sinh viên import không được để trống")
    private List<StudentImportRowDTO> rows;
}
