package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.thesis.dto.*;
import com.example.thesis_hub_api.thesis.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    @PostMapping
    public ApiResponse<ProposalResponse> createProposal(@Valid @RequestBody CreateProposalRequest request) {
        return ApiResponse.success("Tạo đề cương thành công", proposalService.createProposal(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProposalResponse> updateProposal(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProposalRequest request) {
        return ApiResponse.success("Cập nhật đề cương thành công", proposalService.updateProposal(id, request));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<ProposalResponse> submitProposal(@PathVariable Long id) {
        return ApiResponse.success("Nộp đề cương thành công", proposalService.submitProposal(id));
    }

    @PostMapping("/{id}/supervisor-approve")
    public ApiResponse<ProposalResponse> supervisorApprove(
            @PathVariable Long id,
            @RequestParam boolean approved,
            @RequestParam(required = false) String comment) {
        return ApiResponse.success("Phê duyệt đề cương bởi GVHD thành công",
                proposalService.supervisorApprove(id, approved, comment));
    }

    @PostMapping("/{id}/assign-review-group")
    public ApiResponse<ProposalResponse> assignToReviewGroup(
            @PathVariable Long id,
            @RequestParam Long reviewGroupId,
            @RequestParam(required = false) Long assignedById) {
        return ApiResponse.success("Phân công đề cương cho nhóm xét duyệt thành công",
                proposalService.assignToReviewGroup(id, reviewGroupId, assignedById));
    }

    @PostMapping("/{id}/reviews")
    public ApiResponse<ProposalResponse> reviewProposal(
            @PathVariable Long id,
            @Valid @RequestBody ReviewProposalRequest request) {
        return ApiResponse.success("Đánh giá đề cương thành công",
                proposalService.reviewProposal(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProposalResponse> getProposalById(@PathVariable Long id) {
        return ApiResponse.success(proposalService.getProposalById(id));
    }

    @GetMapping("/by-student-and-round")
    public ApiResponse<ProposalResponse> getProposalByStudentAndRound(
            @RequestParam Long studentId,
            @RequestParam Long roundId) {
        return ApiResponse.success(proposalService.getProposalByStudentAndRound(studentId, roundId));
    }

    @GetMapping
    public ApiResponse<Page<ProposalResponse>> searchProposals(
            @RequestParam(required = false) Long roundId,
            @RequestParam(required = false) Long lecturerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ApiResponse.success(proposalService.searchProposals(roundId, lecturerId, status, search, pageable));
    }
}
