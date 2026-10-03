package com.example.thesis_hub_api.assignment.controller;

import com.example.thesis_hub_api.assignment.entity.SupervisorAssignment;
import com.example.thesis_hub_api.assignment.service.SupervisorAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class SupervisorAssignmentController {

    private final SupervisorAssignmentService assignmentService;

    private String extractUsername(Principal principal) {
        return principal != null ? principal.getName() : "system";
    }

    @PostMapping("/generate")
    public ResponseEntity<List<SupervisorAssignment>> generateAssignments(
            @RequestParam Integer projectRoundId,
            Principal principal) {
        String performedBy = extractUsername(principal);
        return ResponseEntity.ok(assignmentService.generateAssignments(projectRoundId, performedBy));
    }

    @GetMapping("/proposals")
    public ResponseEntity<List<SupervisorAssignment>> getProposals(
            @RequestParam Integer projectRoundId) {
        return ResponseEntity.ok(assignmentService.getProposals(projectRoundId));
    }

    @PutMapping("/{id}/override")
    public ResponseEntity<SupervisorAssignment> overrideAssignment(
            @PathVariable("id") Integer id,
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        Integer newLecturerId = (Integer) payload.get("newLecturerId");
        String reason = (String) payload.get("reason");
        String performedBy = extractUsername(principal);
        
        return ResponseEntity.ok(assignmentService.overrideAssignment(id, newLecturerId, reason, performedBy));
    }

    @PostMapping("/finalize")
    public ResponseEntity<String> finalizeAssignments(
            @RequestParam Integer projectRoundId,
            Principal principal) {
        String performedBy = extractUsername(principal);
        assignmentService.finalizeAssignments(projectRoundId, performedBy);
        return ResponseEntity.ok("Assignments finalized successfully.");
    }
}
