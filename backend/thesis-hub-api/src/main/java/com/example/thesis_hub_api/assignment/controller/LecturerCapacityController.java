package com.example.thesis_hub_api.assignment.controller;

import com.example.thesis_hub_api.assignment.dto.LecturerCapacityRequest;
import com.example.thesis_hub_api.assignment.dto.LecturerCapacityResponse;
import com.example.thesis_hub_api.assignment.service.LecturerCapacityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assignments/lecturer-capacities")
@RequiredArgsConstructor
public class LecturerCapacityController {

    private final LecturerCapacityService service;

    @GetMapping
    public ResponseEntity<List<LecturerCapacityResponse>> getCapacitiesByProjectRound(
            @RequestParam Integer projectRoundId) {
        return ResponseEntity.ok(service.getCapacitiesByProjectRound(projectRoundId));
    }

    @GetMapping("/{lecturerId}")
    public ResponseEntity<LecturerCapacityResponse> getCapacityByLecturerAndRound(
            @PathVariable Integer lecturerId,
            @RequestParam Integer projectRoundId) {
        return ResponseEntity.ok(service.getCapacityByLecturerAndRound(lecturerId, projectRoundId));
    }

    @PostMapping
    public ResponseEntity<LecturerCapacityResponse> createCapacity(
            @RequestBody LecturerCapacityRequest request) {
        return ResponseEntity.ok(service.createCapacity(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LecturerCapacityResponse> updateCapacity(
            @PathVariable Integer id,
            @RequestBody LecturerCapacityRequest request) {
        return ResponseEntity.ok(service.updateCapacity(id, request));
    }

    @GetMapping("/available")
    public ResponseEntity<List<LecturerCapacityResponse>> getAvailableLecturers(
            @RequestParam Integer projectRoundId,
            @RequestParam(required = false) Integer directionId) {
        return ResponseEntity.ok(service.getAvailableLecturers(projectRoundId, directionId));
    }
}
