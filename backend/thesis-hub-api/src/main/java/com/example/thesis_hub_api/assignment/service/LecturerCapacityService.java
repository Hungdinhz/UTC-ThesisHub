package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.LecturerCapacityRequest;
import com.example.thesis_hub_api.assignment.dto.LecturerCapacityResponse;

import java.util.List;

public interface LecturerCapacityService {
    List<LecturerCapacityResponse> getCapacitiesByProjectRound(Integer projectRoundId);
    LecturerCapacityResponse getCapacityByLecturerAndRound(Integer lecturerId, Integer projectRoundId);
    LecturerCapacityResponse createCapacity(LecturerCapacityRequest request);
    LecturerCapacityResponse updateCapacity(Integer id, LecturerCapacityRequest request);
    List<LecturerCapacityResponse> getAvailableLecturers(Integer projectRoundId, Integer directionId);
}
