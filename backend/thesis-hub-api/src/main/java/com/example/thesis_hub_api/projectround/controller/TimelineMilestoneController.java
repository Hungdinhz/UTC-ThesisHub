package com.example.thesis_hub_api.projectround.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.projectround.dto.request.UpdateMilestoneRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.MilestoneResponseDTO;
import com.example.thesis_hub_api.projectround.service.ProjectRoundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/timeline-milestones")
@RequiredArgsConstructor
@Tag(name = "Timeline Milestone Management", description = "Các API điều chỉnh và xóa các mốc thời gian của đợt đồ án")
public class TimelineMilestoneController {

    private final ProjectRoundService projectRoundService;

    @PutMapping("/{milestoneId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật mốc thời gian (Admin)")
    public ResponseEntity<ApiResponse<MilestoneResponseDTO>> updateMilestone(
            @PathVariable Long milestoneId,
            @Valid @RequestBody UpdateMilestoneRequestDTO dto) {
        MilestoneResponseDTO updated = projectRoundService.updateMilestone(milestoneId, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mốc thời gian thành công", updated));
    }

    @DeleteMapping("/{milestoneId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Xóa mốc thời gian (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteMilestone(@PathVariable Long milestoneId) {
        projectRoundService.deleteMilestone(milestoneId);
        return ResponseEntity.ok(ApiResponse.success("Xóa mốc thời gian thành công", null));
    }
}
