package com.example.thesis_hub_api.assignment.mapper;

import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.entity.*;
import org.springframework.stereotype.Component;

@Component
public class AssignmentMapper {

    public ProjectDirectionResponseDTO toDirectionResponse(ProjectDirection entity, String departmentName, int lecturerCount) {
        if (entity == null) return null;
        return ProjectDirectionResponseDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .departmentId(entity.getDepartmentId())
                .departmentName(departmentName)
                .isActive(entity.getIsActive())
                .lecturerCount(lecturerCount)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public LecturerDirectionResponseDTO toLecturerDirectionResponse(
            LecturerDirection entity,
            String lecturerCode,
            String lecturerName,
            String degree,
            String directionCode,
            String directionName) {
        if (entity == null) return null;
        return LecturerDirectionResponseDTO.builder()
                .id(entity.getId())
                .lecturerId(entity.getLecturerId())
                .lecturerCode(lecturerCode)
                .lecturerName(lecturerName)
                .academicDegree(degree)
                .directionId(entity.getDirectionId())
                .directionCode(directionCode)
                .directionName(directionName)
                .isPrimary(entity.getIsPrimary())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public LecturerCapacityResponseDTO toCapacityResponse(
            LecturerCapacity entity,
            String lecturerCode,
            String fullName,
            String email,
            String phone,
            String degree,
            Long departmentId,
            String departmentName,
            java.util.List<String> directionNames) {
        return toCapacityResponse(entity, lecturerCode, fullName, email, phone, degree, departmentId, departmentName, directionNames, null, null);
    }

    public LecturerCapacityResponseDTO toCapacityResponse(
            LecturerCapacity entity,
            String lecturerCode,
            String fullName,
            String email,
            String phone,
            String degree,
            Long departmentId,
            String departmentName,
            java.util.List<String> directionNames,
            java.util.List<Long> directionIds,
            java.util.List<String> directionCodes) {
        if (entity == null) return null;

        int effective = entity.getEffectiveCapacity();
        int remaining = entity.getRemainingCapacity();
        double loadRatio = effective > 0 ? (double) entity.getAssignedCount() / (double) effective : 0.0;

        return LecturerCapacityResponseDTO.builder()
                .id(entity.getId())
                .lecturerId(entity.getLecturerId())
                .lecturerCode(lecturerCode)
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .academicDegree(degree)
                .departmentId(departmentId)
                .departmentName(departmentName)
                .projectRoundId(entity.getProjectRoundId())
                .maxQuota(entity.getMaxQuota())
                .capacityFactor(entity.getCapacityFactor())
                .effectiveCapacity(effective)
                .currentAssigned(entity.getAssignedCount())
                .remainingCapacity(remaining)
                .loadRatio(Math.round(loadRatio * 100.0) / 100.0)
                .isActive(entity.getIsActive())
                .note(entity.getNote())
                .directionNames(directionNames)
                .directionIds(directionIds)
                .directionCodes(directionCodes)
                .build();
    }

    public DirectionRegistrationResponseDTO toRegistrationResponse(
            DirectionRegistration entity,
            String studentCode,
            String studentName,
            String studentClass,
            String trainingProgramCode,
            String roundCode,
            String directionCode,
            String directionName) {
        if (entity == null) return null;
        return DirectionRegistrationResponseDTO.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .studentCode(studentCode)
                .studentName(studentName)
                .studentClass(studentClass)
                .trainingProgramCode(trainingProgramCode)
                .projectRoundId(entity.getProjectRoundId())
                .projectRoundCode(roundCode)
                .directionId(entity.getDirectionId())
                .directionCode(directionCode)
                .directionName(directionName)
                .status(entity.getStatus())
                .registeredAt(entity.getRegisteredAt())
                .note(entity.getNote())
                .build();
    }

    public PreferenceResponseDTO toPreferenceResponse(
            Preference entity,
            String studentCode,
            String studentName,
            String trainingProgramCode,
            String lecturerCode,
            String lecturerName,
            String degree) {
        if (entity == null) return null;
        return PreferenceResponseDTO.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .studentCode(studentCode)
                .studentName(studentName)
                .trainingProgramCode(trainingProgramCode)
                .projectRoundId(entity.getProjectRoundId())
                .lecturerId(entity.getLecturerId())
                .lecturerCode(lecturerCode)
                .lecturerName(lecturerName)
                .academicDegree(degree)
                .priority(entity.getPriority())
                .gpa(entity.getGpa())
                .prioritizationCriteria(entity.getPrioritizationCriteria())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public SupervisorAssignmentResponseDTO toAssignmentResponse(
            SupervisorAssignment entity,
            String studentCode,
            String studentName,
            String studentClass,
            String trainingProgramCode,
            String lecturerCode,
            String lecturerName,
            String degree,
            String departmentName,
            String directionCode,
            String directionName,
            String previousLecturerName) {
        if (entity == null) return null;
        return SupervisorAssignmentResponseDTO.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .studentCode(studentCode)
                .studentName(studentName)
                .studentClass(studentClass)
                .trainingProgramCode(trainingProgramCode)
                .lecturerId(entity.getLecturerId())
                .lecturerCode(lecturerCode)
                .lecturerName(lecturerName)
                .academicDegree(degree)
                .departmentName(departmentName)
                .projectRoundId(entity.getProjectRoundId())
                .directionId(entity.getDirectionId())
                .directionCode(directionCode)
                .directionName(directionName)
                .matchedPriority(entity.getMatchedPriority())
                .matchScore(entity.getMatchScore())
                .assignmentMethod(entity.getAssignmentMethod())
                .status(entity.getStatus())
                .isOverridden(entity.getIsOverridden())
                .previousLecturerId(entity.getPreviousLecturerId())
                .previousLecturerName(previousLecturerName)
                .overrideReason(entity.getOverrideReason())
                .overriddenAt(entity.getOverriddenAt())
                .finalizedAt(entity.getFinalizedAt())
                .note(entity.getNote())
                .build();
    }
}
