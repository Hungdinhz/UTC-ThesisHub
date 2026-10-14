package com.example.thesis_hub_api.projectround.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentRoundStatusRequestDTO {

    @NotBlank(message = "Trạng thái không được để trống")
    private String status;

    private String note;
}
