package com.example.thesis_hub_api.projectround.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMilestoneRequestDTO {

    @Size(max = 255, message = "Tên mốc thời gian tối đa 255 ký tự")
    private String name;

    @Size(max = 100, message = "Loại giai đoạn tối đa 100 ký tự")
    private String phaseType;

    private Instant startDate;

    private Instant endDate;

    private String description;

    private Integer orderIndex;
}
