package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.*;

import java.util.List;

public interface AssignmentService {

    // 1. Directions
    List<ProjectDirectionResponseDTO> getAllDirections(Boolean activeOnly);
    ProjectDirectionResponseDTO getDirectionById(Long id);
    ProjectDirectionResponseDTO createDirection(ProjectDirectionRequestDTO request);
    ProjectDirectionResponseDTO updateDirection(Long id, ProjectDirectionRequestDTO request);

    // 2. Lecturer Directions
    List<LecturerDirectionResponseDTO> getLecturerDirections(Long lecturerId, Long directionId);
    LecturerDirectionResponseDTO assignLecturerDirection(LecturerDirectionRequestDTO request);
    void removeLecturerDirection(Long id);

    // 3. Student Direction Registrations
    DirectionRegistrationResponseDTO registerDirection(DirectionRegistrationRequestDTO request, Long currentUserId);
    DirectionRegistrationResponseDTO getStudentDirectionRegistration(Long studentId, Long projectRoundId);
    List<DirectionRegistrationResponseDTO> getRegistrationsByRound(Long projectRoundId, Long directionId);

    // 4. Preferences (NV1, NV2, NV3)
    List<PreferenceResponseDTO> submitPreferences(PreferenceSubmitRequestDTO request, Long currentUserId);
    List<PreferenceResponseDTO> getStudentPreferences(Long studentId, Long projectRoundId);
    List<PreferenceResponseDTO> getPreferencesByRound(Long projectRoundId);

    // 5. Capacities
    List<LecturerCapacityResponseDTO> getCapacitiesByRound(Long projectRoundId);
    LecturerCapacityResponseDTO updateCapacity(Long id, CapacityUpdateRequestDTO request);
    void initializeCapacitiesForRound(Long projectRoundId, int defaultQuota);
    void addLecturersToRound(Long projectRoundId, List<Long> lecturerIds, Integer defaultQuota);
    void addLecturersToRound(Long projectRoundId, List<Long> lecturerIds, Integer defaultQuota, java.util.Map<Long, Integer> lecturerQuotas);
    void deleteCapacity(Long id);
    void deleteCapacityByRoundAndLecturer(Long projectRoundId, Long lecturerId);

    // 6. Algorithm & Assignment Results
    List<SupervisorAssignmentResponseDTO> generateAssignments(AssignmentGenerateRequestDTO request);
    List<SupervisorAssignmentResponseDTO> getProposalsByRound(Long projectRoundId, String status);
    SupervisorAssignmentResponseDTO overrideAssignment(Long assignmentId, AssignmentOverrideRequestDTO request, Long currentUserId);
    AssignmentStatsResponseDTO finalizeAssignments(AssignmentFinalizeRequestDTO request, Long currentUserId);
    AssignmentStatsResponseDTO getAssignmentStats(Long projectRoundId);
    AssignmentStatsResponseDTO openSupplementaryRegistration(Long projectRoundId);
    AssignmentStatsResponseDTO finalizeSupplementaryRegistration(Long projectRoundId, Long currentUserId);
}
