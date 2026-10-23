package com.example.thesis_hub_api.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddLecturersToRoundRequestDTO {

    private List<Long> lecturerIds;

    private Integer defaultQuota;

    /**
     * Optional custom quota map per lecturer: lecturerId -> quota
     */
    private Map<Long, Integer> lecturerQuotas;
}
