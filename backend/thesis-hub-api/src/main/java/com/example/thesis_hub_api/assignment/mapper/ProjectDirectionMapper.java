package com.example.thesis_hub_api.assignment.mapper;

import com.example.thesis_hub_api.assignment.dto.ProjectDirectionDto;
import com.example.thesis_hub_api.assignment.entity.ProjectDirection;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProjectDirectionMapper {

    public ProjectDirectionDto toDto(ProjectDirection entity) {
        if (entity == null) {
            return null;
        }
        return ProjectDirectionDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .projectRoundId(entity.getProjectRoundId())
                .build();
    }

    public List<ProjectDirectionDto> toDtoList(List<ProjectDirection> entities) {
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }
}
