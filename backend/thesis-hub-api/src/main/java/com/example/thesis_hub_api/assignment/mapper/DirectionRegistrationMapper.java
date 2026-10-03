package com.example.thesis_hub_api.assignment.mapper;

import com.example.thesis_hub_api.assignment.dto.PreferenceItemDto;
import com.example.thesis_hub_api.assignment.dto.RegistrationResponseDto;
import com.example.thesis_hub_api.assignment.entity.DirectionRegistration;
import com.example.thesis_hub_api.assignment.entity.Preference;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DirectionRegistrationMapper {

    public RegistrationResponseDto toDto(DirectionRegistration registration, List<Preference> preferences) {
        if (registration == null) {
            return null;
        }

        List<PreferenceItemDto> prefDtos = preferences.stream()
                .map(p -> PreferenceItemDto.builder()
                        .lecturerId(p.getLecturerId())
                        .priorityOrder(p.getPriorityOrder())
                        .build())
                .collect(Collectors.toList());

        String extraCriteria = preferences.isEmpty() ? null : preferences.get(0).getExtraCriteria();

        return RegistrationResponseDto.builder()
                .id(registration.getId())
                .studentId(registration.getStudentId())
                .projectDirectionId(registration.getProjectDirection().getId())
                .status(registration.getStatus())
                .preferences(prefDtos)
                .extraCriteria(extraCriteria)
                .build();
    }
}
