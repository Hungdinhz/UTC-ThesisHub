package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.AssignmentExportDto;
import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.repository.SupervisorAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentSharedServiceImpl implements AssignmentSharedService {

    private final SupervisorAssignmentRepository assignmentRepository;

    @Override
    public List<AssignmentExportDto> getFinalizedAssignments(Integer projectRoundId) {
        return assignmentRepository.findByProjectRoundId(projectRoundId).stream()
                .filter(a -> "FINAL".equals(a.getStatus()))
                .map(this::mapToExportDto)
                .collect(Collectors.toList());
    }

    @Override
    public AssignmentExportDto getAssignmentForStudent(Integer studentId, Integer projectRoundId) {
        return assignmentRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId)
                .filter(a -> "FINAL".equals(a.getStatus()))
                .map(this::mapToExportDto)
                .orElse(null);
    }

    private AssignmentExportDto mapToExportDto(SupervisorAssignment assignment) {
        return AssignmentExportDto.builder()
                .studentId(assignment.getStudentId())
                .lecturerId(assignment.getLecturerId())
                .projectDirectionId(assignment.getProjectDirectionId())
                .projectRoundId(assignment.getProjectRoundId())
                .build();
    }
}
