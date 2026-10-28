package com.example.thesis_hub_api.assignment.controller;

import com.example.thesis_hub_api.assignment.dto.*;
import com.example.thesis_hub_api.assignment.service.AssignmentService;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
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
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
@Tag(name = "Assignment Management", description = "Các API đăng ký hướng đồ án, quản lý nguyện vọng, capacity và thuật toán phân công GVHD (Module 2)")
public class AssignmentController {

    private final AssignmentService assignmentService;

    // ==========================================
    // 1. Project Directions
    // ==========================================

    @GetMapping("/directions")
    @Operation(summary = "Lấy danh sách hướng đồ án", description = "Trả về danh sách hướng đồ án (có lọc theo isActive nếu cần)")
    public ResponseEntity<ApiResponse<List<ProjectDirectionResponseDTO>>> getAllDirections(
            @RequestParam(required = false) Boolean activeOnly) {
        List<ProjectDirectionResponseDTO> list = assignmentService.getAllDirections(activeOnly);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/directions/{id}")
    @Operation(summary = "Xem chi tiết một hướng đồ án")
    public ResponseEntity<ApiResponse<ProjectDirectionResponseDTO>> getDirectionById(@PathVariable Long id) {
        ProjectDirectionResponseDTO dto = assignmentService.getDirectionById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/directions")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Tạo mới một hướng đồ án")
    public ResponseEntity<ApiResponse<ProjectDirectionResponseDTO>> createDirection(
            @Valid @RequestBody ProjectDirectionRequestDTO request) {
        ProjectDirectionResponseDTO created = assignmentService.createDirection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hướng đồ án thành công", created));
    }

    @PutMapping("/directions/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin hướng đồ án")
    public ResponseEntity<ApiResponse<ProjectDirectionResponseDTO>> updateDirection(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDirectionRequestDTO request) {
        ProjectDirectionResponseDTO updated = assignmentService.updateDirection(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hướng đồ án thành công", updated));
    }

    // ==========================================
    // 2. Lecturer Directions
    // ==========================================

    @GetMapping("/lecturer-directions")
    @Operation(summary = "Lấy danh sách chuyên môn / hướng nghiên cứu của giảng viên")
    public ResponseEntity<ApiResponse<List<LecturerDirectionResponseDTO>>> getLecturerDirections(
            @RequestParam(required = false) Long lecturerId,
            @RequestParam(required = false) Long directionId) {
        List<LecturerDirectionResponseDTO> list = assignmentService.getLecturerDirections(lecturerId, directionId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/lecturer-directions")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Gán giảng viên vào hướng đồ án")
    public ResponseEntity<ApiResponse<LecturerDirectionResponseDTO>> assignLecturerDirection(
            @Valid @RequestBody LecturerDirectionRequestDTO request) {
        LecturerDirectionResponseDTO result = assignmentService.assignLecturerDirection(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gán giảng viên vào hướng đồ án thành công", result));
    }

    @DeleteMapping("/lecturer-directions/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Xóa phân công hướng của giảng viên")
    public ResponseEntity<ApiResponse<Void>> removeLecturerDirection(@PathVariable Long id) {
        assignmentService.removeLecturerDirection(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa liên kết thành công", null));
    }

    // ==========================================
    // 3. Direction Registrations (Mục A)
    // ==========================================

    @PostMapping("/register-direction")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_ADMIN')")
    @Operation(summary = "Sinh viên đăng ký hướng đồ án", description = "Đăng ký hướng đề tài cho đợt đồ án")
    public ResponseEntity<ApiResponse<DirectionRegistrationResponseDTO>> registerDirection(
            @Valid @RequestBody DirectionRegistrationRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        DirectionRegistrationResponseDTO result = assignmentService.registerDirection(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký hướng đồ án thành công", result));
    }

    @GetMapping("/registrations")
    @Operation(summary = "Xem danh sách sinh viên đăng ký hướng theo đợt")
    public ResponseEntity<ApiResponse<List<DirectionRegistrationResponseDTO>>> getRegistrations(
            @RequestParam Long projectRoundId,
            @RequestParam(required = false) Long directionId) {
        List<DirectionRegistrationResponseDTO> list = assignmentService.getRegistrationsByRound(projectRoundId, directionId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ==========================================
    // 4. Preferences (Mục A & E)
    // ==========================================

    @GetMapping("/preferences")
    @Operation(summary = "Tra cứu danh sách nguyện vọng (Step E)")
    public ResponseEntity<ApiResponse<List<PreferenceResponseDTO>>> getPreferences(
            @RequestParam Long projectRoundId,
            @RequestParam(required = false) Long studentId) {
        List<PreferenceResponseDTO> list = (studentId != null)
                ? assignmentService.getStudentPreferences(studentId, projectRoundId)
                : assignmentService.getPreferencesByRound(projectRoundId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/preferences")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_ADMIN')")
    @Operation(summary = "Sinh viên gửi 3 nguyện vọng GVHD và tiêu chí phụ (Step A & E)")
    public ResponseEntity<ApiResponse<List<PreferenceResponseDTO>>> submitPreferences(
            @Valid @RequestBody PreferenceSubmitRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        List<PreferenceResponseDTO> list = assignmentService.submitPreferences(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Gửi nguyện vọng thành công", list));
    }

    // ==========================================
    // 5. Capacities (Mục B)
    // ==========================================

    @GetMapping("/capacities")
    @Operation(summary = "Danh sách chỉ tiêu & capacity giảng viên theo đợt")
    public ResponseEntity<ApiResponse<List<LecturerCapacityResponseDTO>>> getCapacities(
            @RequestParam Long projectRoundId) {
        List<LecturerCapacityResponseDTO> list = assignmentService.getCapacitiesByRound(projectRoundId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/capacities/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN')")
    @Operation(summary = "Cập nhật chỉ tiêu / hệ số capacity của giảng viên")
    public ResponseEntity<ApiResponse<LecturerCapacityResponseDTO>> updateCapacity(
            @PathVariable Long id,
            @Valid @RequestBody CapacityUpdateRequestDTO request) {
        LecturerCapacityResponseDTO updated = assignmentService.updateCapacity(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chỉ tiêu thành công", updated));
    }

    @DeleteMapping("/capacities/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN') or hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xóa giảng viên khỏi đợt đồ án")
    public ResponseEntity<ApiResponse<Void>> deleteCapacity(@PathVariable Long id) {
        assignmentService.deleteCapacity(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa giảng viên khỏi đợt đồ án thành công", null));
    }

    @PostMapping("/capacities/{id}/delete")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN') or hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xóa giảng viên khỏi đợt đồ án (POST fallback)")
    public ResponseEntity<ApiResponse<Void>> deleteCapacityPost(@PathVariable Long id) {
        assignmentService.deleteCapacity(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa giảng viên khỏi đợt đồ án thành công", null));
    }

    @DeleteMapping("/capacities/by-round")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN') or hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xóa giảng viên khỏi đợt đồ án theo ProjectRoundId và LecturerId")
    public ResponseEntity<ApiResponse<Void>> deleteCapacityByRound(
            @RequestParam Long projectRoundId,
            @RequestParam Long lecturerId) {
        assignmentService.deleteCapacityByRoundAndLecturer(projectRoundId, lecturerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa giảng viên khỏi đợt đồ án thành công", null));
    }

    @PostMapping("/capacities/by-round/delete")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN') or hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xóa giảng viên khỏi đợt đồ án theo ProjectRoundId và LecturerId (POST fallback)")
    public ResponseEntity<ApiResponse<Void>> deleteCapacityByRoundPost(
            @RequestParam Long projectRoundId,
            @RequestParam Long lecturerId) {
        assignmentService.deleteCapacityByRoundAndLecturer(projectRoundId, lecturerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa giảng viên khỏi đợt đồ án thành công", null));
    }

    @PostMapping("/capacities/init")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN')")
    @Operation(summary = "Khởi tạo bảng chỉ tiêu cho toàn bộ giảng viên trong đợt")
    public ResponseEntity<ApiResponse<Void>> initCapacities(
            @RequestParam Long projectRoundId,
            @RequestParam(defaultValue = "5") int defaultQuota) {
        assignmentService.initializeCapacitiesForRound(projectRoundId, defaultQuota);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo chỉ tiêu thành công", null));
    }

    @PostMapping("/capacities/add-lecturers")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN')")
    @Operation(summary = "Thêm danh sách giảng viên được chọn vào đợt đồ án")
    public ResponseEntity<ApiResponse<Void>> addLecturersToRound(
            @RequestParam Long projectRoundId,
            @RequestBody(required = false) AddLecturersToRoundRequestDTO request,
            @RequestParam(required = false, defaultValue = "5") int defaultQuota) {
        List<Long> lecturerIds = request != null ? request.getLecturerIds() : null;
        Integer quota = (request != null && request.getDefaultQuota() != null) ? request.getDefaultQuota() : defaultQuota;
        java.util.Map<Long, Integer> quotas = request != null ? request.getLecturerQuotas() : null;
        assignmentService.addLecturersToRound(projectRoundId, lecturerIds, quota, quotas);
        return ResponseEntity.ok(ApiResponse.success("Thêm giảng viên vào đợt đồ án thành công", null));
    }

    // ==========================================
    // 6. Algorithm Execution & Proposals (Mục C & E)
    // ==========================================

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Chạy thuật toán phân công đề xuất (Step C & E: POST /assignments/generate)")
    public ResponseEntity<ApiResponse<List<SupervisorAssignmentResponseDTO>>> generateAssignments(
            @Valid @RequestBody AssignmentGenerateRequestDTO request) {
        List<SupervisorAssignmentResponseDTO> result = assignmentService.generateAssignments(request);
        return ResponseEntity.ok(ApiResponse.success("Chạy thuật toán phân công thành công", result));
    }

    @GetMapping("/proposals")
    @Operation(summary = "Lấy danh sách phân công đề xuất (Step C & E: GET /assignments/proposals)")
    public ResponseEntity<ApiResponse<List<SupervisorAssignmentResponseDTO>>> getProposals(
            @RequestParam Long projectRoundId,
            @RequestParam(required = false) String status) {
        List<SupervisorAssignmentResponseDTO> list = assignmentService.getProposalsByRound(projectRoundId, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/{id}/override")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Khoa điều chỉnh (override) thủ công kết quả (Step C & E: PUT /assignments/{id}/override)")
    public ResponseEntity<ApiResponse<SupervisorAssignmentResponseDTO>> overrideAssignment(
            @PathVariable Long id,
            @Valid @RequestBody AssignmentOverrideRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        SupervisorAssignmentResponseDTO result = assignmentService.overrideAssignment(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh kết quả phân công thành công", result));
    }

    @PostMapping("/finalize")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Khoa chốt kết quả phân công cuối cùng (Step C & E: POST /assignments/finalize)")
    public ResponseEntity<ApiResponse<AssignmentStatsResponseDTO>> finalizeAssignments(
            @Valid @RequestBody AssignmentFinalizeRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        AssignmentStatsResponseDTO stats = assignmentService.finalizeAssignments(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Chốt kết quả phân công thành công", stats));
    }

    @GetMapping("/stats")
    @Operation(summary = "Thống kê kết quả phân công và tải giảng viên")
    public ResponseEntity<ApiResponse<AssignmentStatsResponseDTO>> getStats(
            @RequestParam Long projectRoundId) {
        AssignmentStatsResponseDTO stats = assignmentService.getAssignmentStats(projectRoundId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping("/supplementary/open")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN') or hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Mở đợt đăng ký bổ sung cho các sinh viên chưa đăng ký nguyện vọng")
    public ResponseEntity<ApiResponse<AssignmentStatsResponseDTO>> openSupplementaryRegistration(
            @RequestParam Long projectRoundId) {
        AssignmentStatsResponseDTO stats = assignmentService.openSupplementaryRegistration(projectRoundId);
        return ResponseEntity.ok(ApiResponse.success("Đã mở đợt đăng ký bổ sung nguyện vọng cho sinh viên chưa đăng ký", stats));
    }

    @PostMapping("/supplementary/finalize")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY_ADMIN') or hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Chốt đợt đăng ký bổ sung và xóa hẳn những sinh viên vẫn không đăng ký khỏi đợt đồ án")
    public ResponseEntity<ApiResponse<AssignmentStatsResponseDTO>> finalizeSupplementaryRegistration(
            @RequestParam Long projectRoundId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        AssignmentStatsResponseDTO stats = assignmentService.finalizeSupplementaryRegistration(projectRoundId, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã chốt đợt đăng ký bổ sung và xóa các sinh viên không đăng ký khỏi đợt đồ án", stats));
    }
}
