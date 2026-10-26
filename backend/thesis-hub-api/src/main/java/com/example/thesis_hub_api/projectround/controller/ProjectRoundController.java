package com.example.thesis_hub_api.projectround.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.projectround.dto.request.CreateMilestoneRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.CreateProjectRoundRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateProjectRoundRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateRoundStatusRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.MilestoneResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.ProjectRoundResponseDTO;
import com.example.thesis_hub_api.projectround.service.ProjectRoundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/project-rounds")
@RequiredArgsConstructor
@Tag(name = "Project Round Management", description = "Các API khởi tạo đợt đồ án, quản lý mốc thời gian và vòng đời đợt (Contract 2)")
public class ProjectRoundController {

    private final ProjectRoundService projectRoundService;

    /**
     * CONTRACT 2: API Tra cứu Đợt đồ án đang hoạt động & Mốc thời gian (Timeline).
     * Phục vụ unblock cho cả 3 thành viên: Công (phân công GVHD), Quyết (gán đề tài), Khoa (xét điều kiện/bảo vệ).
     */
    @GetMapping("/active")
    @Operation(
            summary = "Tra cứu đợt đồ án đang mở (Contract 2)",
            description = "Trả về thông tin đợt đồ án đang ở trạng thái OPEN hoặc IN_PROGRESS kèm toàn bộ các mốc timeline và trạng thái isActive từng mốc"
    )
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> getActiveRound() {
        ProjectRoundResponseDTO activeRound = projectRoundService.getActiveRound();
        return ResponseEntity.ok(ApiResponse.success(activeRound));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các đợt đồ án", description = "Lọc theo trạng thái và năm học")
    public ResponseEntity<ApiResponse<List<ProjectRoundResponseDTO>>> getRounds(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String academicYear) {
        List<ProjectRoundResponseDTO> rounds = projectRoundService.getRounds(status, academicYear);
        return ResponseEntity.ok(ApiResponse.success(rounds));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một đợt đồ án kèm các mốc timeline")
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> getRoundById(@PathVariable Long id) {
        ProjectRoundResponseDTO round = projectRoundService.getRoundById(id);
        return ResponseEntity.ok(ApiResponse.success(round));
    }

    @GetMapping("/{id}/current-milestone")
    @Operation(summary = "Lấy giai đoạn/mốc thời gian hiện tại đang diễn ra của đợt đồ án")
    public ResponseEntity<ApiResponse<MilestoneResponseDTO>> getCurrentMilestone(@PathVariable Long id) {
        MilestoneResponseDTO milestone = projectRoundService.getCurrentMilestone(id);
        return ResponseEntity.ok(ApiResponse.success(milestone));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Tạo mới đợt đồ án (Admin)", description = "Khởi tạo đợt đồ án với trạng thái ban đầu DRAFT")
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> createRound(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateProjectRoundRequestDTO dto) {
        Long userId = (currentUser != null) ? currentUser.getId() : null;
        ProjectRoundResponseDTO created = projectRoundService.createRound(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo đợt đồ án thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin chung của đợt đồ án (Admin)")
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> updateRound(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRoundRequestDTO dto) {
        ProjectRoundResponseDTO updated = projectRoundService.updateRound(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đợt đồ án thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Chuyển đổi trạng thái đợt đồ án (Admin)", description = "Các trạng thái: DRAFT, OPEN, IN_PROGRESS, CLOSED, ARCHIVED")
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> updateRoundStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoundStatusRequestDTO dto) {
        ProjectRoundResponseDTO updated = projectRoundService.updateRoundStatus(id, dto.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đợt đồ án thành công", updated));
    }

    // ─── TIMELINE MILESTONES ───────────────────────────────────────────────────
    @GetMapping("/{roundId}/milestones")
    @Operation(summary = "Lấy danh sách các mốc thời gian (Timeline) của đợt đồ án")
    public ResponseEntity<ApiResponse<List<MilestoneResponseDTO>>> getMilestones(@PathVariable Long roundId) {
        List<MilestoneResponseDTO> list = projectRoundService.getMilestonesByRoundId(roundId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{roundId}/milestones")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Thêm mốc thời gian mới cho đợt đồ án (Admin)")
    public ResponseEntity<ApiResponse<MilestoneResponseDTO>> addMilestone(
            @PathVariable Long roundId,
            @Valid @RequestBody CreateMilestoneRequestDTO dto) {
        MilestoneResponseDTO created = projectRoundService.addMilestone(roundId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mốc thời gian thành công", created));
    }

    // ─── DEMO PHASE TRANSITION CONTROLS ─────────────────────────────────────────
    @PostMapping(value = {"/active/advance-phase", "/advance-active-phase"})
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN') or hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN')")
    @Operation(summary = "Demo: Kết thúc giai đoạn của đợt đồ án đang mở và chuyển sang giai đoạn tiếp theo (Admin)")
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> advanceActivePhase(
            @RequestParam(required = false) String targetPhaseType) {
        ProjectRoundResponseDTO activeRound = projectRoundService.getActiveRound();
        ProjectRoundResponseDTO round = projectRoundService.advanceRoundPhase(activeRound.getRoundId(), targetPhaseType);
        return ResponseEntity.ok(ApiResponse.success("Chuyển giai đoạn đợt đồ án thành công", round));
    }

    @PostMapping("/{roundId}/advance-phase")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN') or hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN')")
    @Operation(summary = "Demo: Kết thúc giai đoạn hiện tại và chuyển sang giai đoạn tiếp theo (Admin)")
    public ResponseEntity<ApiResponse<ProjectRoundResponseDTO>> advancePhase(
            @PathVariable Long roundId,
            @RequestParam(required = false) String targetPhaseType) {
        ProjectRoundResponseDTO round = projectRoundService.advanceRoundPhase(roundId, targetPhaseType);
        return ResponseEntity.ok(ApiResponse.success("Chuyển giai đoạn đợt đồ án thành công", round));
    }
}
