package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.thesis.dto.CreateReviewGroupRequest;
import com.example.thesis_hub_api.thesis.dto.ReviewGroupResponse;
import com.example.thesis_hub_api.thesis.service.ReviewGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/review-groups")
@RequiredArgsConstructor
public class ReviewGroupController {

    private final ReviewGroupService reviewGroupService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReviewGroupResponse> createReviewGroup(@Valid @RequestBody CreateReviewGroupRequest request) {
        return ApiResponse.success("Tạo nhóm xét duyệt thành công", reviewGroupService.createReviewGroup(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReviewGroupResponse> getReviewGroupById(@PathVariable Long id) {
        return ApiResponse.success(reviewGroupService.getReviewGroupById(id));
    }

    @GetMapping("/by-round/{roundId}")
    public ApiResponse<List<ReviewGroupResponse>> getReviewGroupsByRound(@PathVariable Long roundId) {
        return ApiResponse.success(reviewGroupService.getReviewGroupsByRound(roundId));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReviewGroupResponse> addMember(
            @PathVariable Long id,
            @RequestParam Long lecturerId,
            @RequestParam(required = false, defaultValue = "MEMBER") String role) {
        return ApiResponse.success("Thêm thành viên nhóm xét duyệt thành công",
                reviewGroupService.addMember(id, lecturerId, role));
    }

    @DeleteMapping("/{id}/members/{lecturerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long lecturerId) {
        reviewGroupService.removeMember(id, lecturerId);
        return ApiResponse.success("Xóa thành viên khỏi nhóm xét duyệt thành công", null);
    }

    @GetMapping
    public ApiResponse<Page<ReviewGroupResponse>> searchReviewGroups(
            @RequestParam(required = false) Long roundId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ApiResponse.success(reviewGroupService.searchReviewGroups(roundId, departmentId, status, pageable));
    }
}
