package com.example.thesis_hub_api.assignment.mapper;

import com.example.thesis_hub_api.assignment.dto.LecturerCapacityResponse;
import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import org.springframework.stereotype.Component;

@Component
public class LecturerCapacityMapper {

    public LecturerCapacityResponse toResponse(LecturerCapacity entity) {
        if (entity == null) {
            return null;
        }

        return LecturerCapacityResponse.builder()
                .id(entity.getId())
                .lecturerId(entity.getLecturerId())
                .projectRoundId(entity.getProjectRoundId())
                .baseQuota(entity.getBaseQuota())
                .capacityCoefficient(entity.getCapacityCoefficient())
                .effectiveCapacity(entity.getEffectiveCapacity())
                .assignedCount(entity.getAssignedCount())
                .remainingCapacity(entity.getRemainingCapacity())
                .build();
    }
}
