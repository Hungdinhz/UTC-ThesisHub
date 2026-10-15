package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.entity.*;
import com.example.thesis_hub_api.assignment.mapper.DirectionRegistrationMapper;
import com.example.thesis_hub_api.assignment.mapper.ProjectDirectionMapper;
import com.example.thesis_hub_api.assignment.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DirectionRegistrationService {

    private final ProjectDirectionRepository projectDirectionRepository;
    private final LecturerDirectionRepository lecturerDirectionRepository;
    private final DirectionRegistrationRepository registrationRepository;
    private final PreferenceRepository preferenceRepository;
    private final IdentitySharedService identitySharedService;
    private final ProjectDirectionMapper projectDirectionMapper;
    private final DirectionRegistrationMapper registrationMapper;

    public List<ProjectDirectionDto> getAvailableDirections(Integer projectRoundId) {
        return projectDirectionMapper.toDtoList(
                projectDirectionRepository.findByProjectRoundIdAndIsActiveTrue(projectRoundId)
        );
    }

    public List<LecturerDto> getLecturersForDirection(Integer directionId) {
        // Find all lecturer directions for this direction
        List<LecturerDirection> lecturerDirections = lecturerDirectionRepository.findByProjectDirectionId(directionId);
        
        // Map to DTO (mocking name for now, in real life we would call IdentitySharedService to get name)
        return lecturerDirections.stream().map(ld -> LecturerDto.builder()
                .id(ld.getLecturerId())
                .fullName("Lecturer " + ld.getLecturerId()) // Mocked
                .degree(identitySharedService.getLecturerDegree(ld.getLecturerId()))
                .build()).collect(Collectors.toList());
    }

    public RegistrationResponseDto getMyPreferences(Integer studentId, Integer projectRoundId) {
        DirectionRegistration registration = registrationRepository.findByStudentIdAndProjectRoundId(studentId, projectRoundId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        
        List<Preference> preferences = preferenceRepository.findByDirectionRegistrationIdOrderByPriorityOrderAsc(registration.getId());
        return registrationMapper.toDto(registration, preferences);
    }

    @Transactional
    public RegistrationResponseDto submitPreferences(Integer studentId, PreferenceSubmitDto dto) {
        // 1. Verify role
        if (!identitySharedService.verifyRole(studentId, "STUDENT")) {
            throw new IllegalArgumentException("User is not a student");
        }

        ProjectDirection direction = projectDirectionRepository.findById(dto.getProjectDirectionId())
                .orElseThrow(() -> new IllegalArgumentException("Direction not found"));

        // 2. Check if already registered
        registrationRepository.findByStudentIdAndProjectRoundId(studentId, direction.getProjectRoundId())
                .ifPresent(reg -> {
                    if ("LOCKED".equals(reg.getStatus())) {
                        throw new IllegalStateException("Already registered and locked");
                    }
                    throw new IllegalStateException("Already registered. Please use update instead.");
                });

        // Validate preferences
        validatePreferences(dto, direction.getId(), studentId);

        // Save registration
        DirectionRegistration registration = DirectionRegistration.builder()
                .studentId(studentId)
                .projectDirection(direction)
                .projectRoundId(direction.getProjectRoundId())
                .status("PENDING")
                .build();
        registration = registrationRepository.save(registration);

        // Save preferences
        List<Preference> preferences = savePreferences(registration, dto);

        return registrationMapper.toDto(registration, preferences);
    }

    @Transactional
    public RegistrationResponseDto updatePreferences(Integer studentId, Integer registrationId, PreferenceSubmitDto dto) {
        DirectionRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));

        // Ownership check
        if (!registration.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("Unauthorized to update this registration");
        }

        if ("LOCKED".equals(registration.getStatus())) {
            throw new IllegalStateException("Cannot update a locked registration");
        }

        // Validate new preferences
        validatePreferences(dto, registration.getProjectDirection().getId(), studentId);

        // Delete old preferences
        preferenceRepository.deleteByDirectionRegistrationId(registrationId);

        // Save new preferences
        List<Preference> preferences = savePreferences(registration, dto);

        return registrationMapper.toDto(registration, preferences);
    }

    private void validatePreferences(PreferenceSubmitDto dto, Integer directionId, Integer studentId) {
        List<PreferenceItemDto> prefs = dto.getPreferences();
        if (prefs == null || prefs.size() != 3) {
            throw new IllegalArgumentException("Must provide exactly 3 preferences");
        }

        Set<Integer> lecturerIds = new HashSet<>();
        Set<Integer> priorityOrders = new HashSet<>();

        String studentProgram = identitySharedService.getStudentProgram(studentId);

        for (PreferenceItemDto pref : prefs) {
            if (!lecturerIds.add(pref.getLecturerId())) {
                throw new IllegalArgumentException("Duplicate lecturer in preferences");
            }
            if (!priorityOrders.add(pref.getPriorityOrder())) {
                throw new IllegalArgumentException("Duplicate priority order");
            }

            // Check if lecturer belongs to direction
            if (!lecturerDirectionRepository.existsByLecturerIdAndProjectDirectionId(pref.getLecturerId(), directionId)) {
                throw new IllegalArgumentException("Lecturer " + pref.getLecturerId() + " does not belong to the selected direction");
            }

            // Degree check for Kỹ sư
            if ("Kỹ sư".equalsIgnoreCase(studentProgram)) {
                String degree = identitySharedService.getLecturerDegree(pref.getLecturerId());
                if (degree == null || degree.equalsIgnoreCase("Cử nhân")) {
                    throw new IllegalArgumentException("Lecturer " + pref.getLecturerId() + " degree is not qualified for Engineering program");
                }
            }
        }
    }

    private List<Preference> savePreferences(DirectionRegistration registration, PreferenceSubmitDto dto) {
        List<Preference> preferences = dto.getPreferences().stream()
                .map(p -> Preference.builder()
                        .directionRegistration(registration)
                        .lecturerId(p.getLecturerId())
                        .priorityOrder(p.getPriorityOrder())
                        .extraCriteria(dto.getExtraCriteria())
                        .build())
                .collect(Collectors.toList());
        return preferenceRepository.saveAll(preferences);
    }
}
