package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.LecturerCapacityRequest;
import com.example.thesis_hub_api.assignment.dto.LecturerCapacityResponse;
import com.example.thesis_hub_api.assignment.entity.LecturerCapacity;
import com.example.thesis_hub_api.assignment.mapper.LecturerCapacityMapper;
import com.example.thesis_hub_api.assignment.repository.LecturerCapacityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LecturerCapacityServiceImpl implements LecturerCapacityService {

    private final LecturerCapacityRepository repository;
    private final LecturerCapacityMapper mapper;
    private final IdentitySharedService identitySharedService;

    @Override
    public List<LecturerCapacityResponse> getCapacitiesByProjectRound(Integer projectRoundId) {
        return repository.findByProjectRoundId(projectRoundId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public LecturerCapacityResponse getCapacityByLecturerAndRound(Integer lecturerId, Integer projectRoundId) {
        LecturerCapacity capacity = repository.findByLecturerIdAndProjectRoundId(lecturerId, projectRoundId)
                .orElseThrow(() -> new IllegalArgumentException("Capacity not found for this lecturer and round"));
        return mapper.toResponse(capacity);
    }

    @Override
    @Transactional
    public LecturerCapacityResponse createCapacity(LecturerCapacityRequest request) {
        if (!identitySharedService.verifyRole(request.getLecturerId(), "LECTURER")) {
            throw new IllegalArgumentException("Invalid lecturer ID or user is not a lecturer");
        }

        // TODO: Validate project round is OPEN using ProjectRound API/Service

        if (repository.findByLecturerIdAndProjectRoundId(request.getLecturerId(), request.getProjectRoundId()).isPresent()) {
            throw new IllegalArgumentException("Capacity already exists for this lecturer and project round");
        }

        if (request.getBaseQuota() < 0) {
            throw new IllegalArgumentException("Base quota must be >= 0");
        }

        LecturerCapacity capacity = LecturerCapacity.builder()
                .lecturerId(request.getLecturerId())
                .projectRoundId(request.getProjectRoundId())
                .baseQuota(request.getBaseQuota())
                .capacityCoefficient(request.getCapacityCoefficient())
                .assignedCount(0)
                .build();

        capacity = repository.save(capacity);
        return mapper.toResponse(capacity);
    }

    @Override
    @Transactional
    public LecturerCapacityResponse updateCapacity(Integer id, LecturerCapacityRequest request) {
        LecturerCapacity capacity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capacity not found with ID: " + id));

        // TODO: Validate project round is OPEN using ProjectRound API/Service

        if (request.getBaseQuota() != null) {
            if (request.getBaseQuota() < 0) {
                throw new IllegalArgumentException("Base quota must be >= 0");
            }
            capacity.setBaseQuota(request.getBaseQuota());
        }

        if (request.getCapacityCoefficient() != null) {
            capacity.setCapacityCoefficient(request.getCapacityCoefficient());
        }

        capacity = repository.save(capacity);
        return mapper.toResponse(capacity);
    }

    @Override
    public List<LecturerCapacityResponse> getAvailableLecturers(Integer projectRoundId, Integer directionId) {
        // Here we can filter by directionId if we join with LecturerDirection
        // For simplicity, this currently fetches all capacities and filters those with remainingCapacity > 0
        List<LecturerCapacity> capacities = repository.findByProjectRoundId(projectRoundId);
        
        // TODO: Integrate with LecturerDirection to filter by directionId if provided
        
        return capacities.stream()
                .filter(c -> c.getRemainingCapacity() > 0)
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
}
