package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.thesis.dto.*;
import com.example.thesis_hub_api.thesis.service.DocumentService;
import com.example.thesis_hub_api.thesis.service.ProposalService;
import com.example.thesis_hub_api.thesis.service.ReviewGroupService;
import com.example.thesis_hub_api.thesis.service.ThesisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ThesisController {

    private final ReviewGroupService reviewGroupService;
    private final ProposalService proposalService;
    private final ThesisService thesisService;
    private final DocumentService documentService;

    // --- Review Groups ---
    @PostMapping("/review-groups")
    public ResponseEntity<ReviewGroupResponseDTO> createReviewGroup(@RequestBody ReviewGroupCreateDTO request) {
        return ResponseEntity.ok(reviewGroupService.createReviewGroup(request));
    }

    @PostMapping("/review-groups/{id}/assign-proposals")
    public ResponseEntity<Void> assignProposals(@PathVariable Long id, @RequestBody List<Long> proposalIds, @RequestParam Long assignedBy) {
        reviewGroupService.assignProposals(id, proposalIds, assignedBy);
        return ResponseEntity.ok().build();
    }

    // --- Proposals ---
    @PostMapping("/proposals")
    public ResponseEntity<ProposalResponseDTO> createProposal(@RequestBody ProposalCreateDTO request) {
        return ResponseEntity.ok(proposalService.createProposal(request));
    }

    @PutMapping("/proposals/{id}/review")
    public ResponseEntity<ProposalResponseDTO> reviewProposal(@PathVariable Long id, @RequestBody ProposalReviewRequestDTO request) {
        return ResponseEntity.ok(proposalService.reviewProposal(id, request));
    }

    @GetMapping("/proposals")
    public ResponseEntity<List<ProposalResponseDTO>> getProposals(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(proposalService.getProposalsByStatus(status));
    }

    // --- Theses ---
    @PostMapping("/theses")
    public ResponseEntity<ThesisResponseDTO> createThesis(@RequestBody ThesisCreateDTO request) {
        return ResponseEntity.ok(thesisService.createThesis(request));
    }

    @PutMapping("/theses/{id}")
    public ResponseEntity<ThesisResponseDTO> updateThesis(@PathVariable Long id, @RequestBody ThesisUpdateDTO request) {
        return ResponseEntity.ok(thesisService.updateThesis(id, request));
    }

    @PutMapping("/theses/{id}/confirm")
    public ResponseEntity<ThesisResponseDTO> confirmThesis(@PathVariable Long id) {
        return ResponseEntity.ok(thesisService.confirmByLecturer(id));
    }

    @PutMapping("/theses/{id}/approve")
    public ResponseEntity<ThesisResponseDTO> approveThesis(@PathVariable Long id, @RequestBody ThesisApprovalDTO request) {
        return ResponseEntity.ok(thesisService.approveByFaculty(id, request));
    }

    @GetMapping("/theses")
    public ResponseEntity<List<ThesisResponseDTO>> getTheses(@RequestParam(required = false) Long roundId, @RequestParam(required = false) String status) {
        return ResponseEntity.ok(thesisService.getTheses(roundId, status));
    }

    // --- Documents ---
    @PostMapping("/documents")
    public ResponseEntity<DocumentResponseDTO> uploadDocument(@RequestBody DocumentUploadDTO request) {
        return ResponseEntity.ok(documentService.uploadDocument(request));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentResponseDTO>> getDocuments(@RequestParam Long thesisId) {
        return ResponseEntity.ok(documentService.getDocumentsByThesis(thesisId));
    }
}
