package com.example.thesis_hub_api.assignment.controller;

import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.service.DirectionRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class DirectionRegistrationController {

    private final DirectionRegistrationService service;

    private Integer extractUserId(Principal principal) {
        // Assuming principal.getName() returns the user ID as string in this system.
        // In reality, this would likely be an extraction from a custom JwtAuthenticationToken.
        if (principal == null || principal.getName() == null) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return Integer.parseInt(principal.getName());
    }

    @GetMapping("/directions")
    public ResponseEntity<List<ProjectDirectionDto>> getAvailableDirections(@RequestParam Integer projectRoundId) {
        return ResponseEntity.ok(service.getAvailableDirections(projectRoundId));
    }

    @GetMapping("/directions/{id}/lecturers")
    public ResponseEntity<List<LecturerDto>> getLecturersForDirection(@PathVariable("id") Integer directionId) {
        return ResponseEntity.ok(service.getLecturersForDirection(directionId));
    }

    @GetMapping("/preferences/me")
    public ResponseEntity<RegistrationResponseDto> getMyPreferences(
            Principal principal,
            @RequestParam Integer projectRoundId) {
        Integer studentId = extractUserId(principal);
        return ResponseEntity.ok(service.getMyPreferences(studentId, projectRoundId));
    }

    @PostMapping("/preferences")
    public ResponseEntity<RegistrationResponseDto> submitPreferences(
            Principal principal,
            @Valid @RequestBody PreferenceSubmitDto dto) {
        Integer studentId = extractUserId(principal);
        return ResponseEntity.ok(service.submitPreferences(studentId, dto));
    }

    @PutMapping("/preferences/{id}")
    public ResponseEntity<RegistrationResponseDto> updatePreferences(
            Principal principal,
            @PathVariable("id") Integer registrationId,
            @Valid @RequestBody PreferenceSubmitDto dto) {
        Integer studentId = extractUserId(principal);
        return ResponseEntity.ok(service.updatePreferences(studentId, registrationId, dto));
    }
}
