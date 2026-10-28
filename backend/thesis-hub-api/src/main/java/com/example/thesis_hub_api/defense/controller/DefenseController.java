package com.example.thesis_hub_api.defense.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.defense.dto.*;
import com.example.thesis_hub_api.defense.service.DefenseService;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/defense")
@RequiredArgsConstructor
public class DefenseController {

    private final DefenseService defenseService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal.getId();
        }
        return null;
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority ga : auth.getAuthorities()) {
            String role = ga.getAuthority();
            if ("ROLE_ADMIN".equalsIgnoreCase(role) || "ROLE_FACULTY_ADMIN".equalsIgnoreCase(role)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 1. API Chạy thuật toán CSP (Backtracking + Greedy) tạo Hội đồng & gán sinh viên
     */
    @PostMapping("/councils/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<List<CouncilResponseDTO>>> generateCouncils(
            @RequestBody(required = false) CouncilGenerationRequestDTO request) {
        CouncilGenerationRequestDTO req = request != null ? request : new CouncilGenerationRequestDTO();
        List<CouncilResponseDTO> result = defenseService.generateCouncils(req);
        return ResponseEntity.ok(ApiResponse.success("Sinh hội đồng và gán sinh viên thành công", result));
    }

    /**
     * Tra cứu danh sách Hội đồng theo đợt
     */
    @GetMapping("/councils")
    public ResponseEntity<ApiResponse<List<CouncilResponseDTO>>> getCouncils(
            @RequestParam(defaultValue = "10") Long projectRoundId) {
        List<CouncilResponseDTO> result = defenseService.getCouncilsByRound(projectRoundId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Xem chi tiết Hội đồng theo ID
     */
    @GetMapping("/councils/{id}")
    public ResponseEntity<ApiResponse<CouncilResponseDTO>> getCouncilById(@PathVariable Long id) {
        CouncilResponseDTO result = defenseService.getCouncilById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Chốt Hội đồng bảo vệ (Khóa hội đồng)
     */
    @PostMapping("/councils/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<CouncilResponseDTO>> finalizeCouncil(@PathVariable Long id) {
        CouncilResponseDTO result = defenseService.finalizeCouncil(id);
        return ResponseEntity.ok(ApiResponse.success("Chốt Hội đồng bảo vệ thành công", result));
    }

    /**
     * Cập nhật danh sách 5 thành viên Hội đồng (1CT - 2TK - 2UV)
     */
    @PutMapping("/councils/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<CouncilResponseDTO>> updateCouncilMembers(
            @PathVariable Long id,
            @RequestBody List<CouncilMemberDTO> members) {
        CouncilResponseDTO result = defenseService.updateCouncilMembers(id, members);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành viên Hội đồng thành công", result));
    }

    /**
     * 2. API Phân công Giảng viên phản biện (Kiểm tra ràng buộc GVPB ≠ GVHD)
     */
    @PostMapping("/reviewers/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<ReviewerAssignmentResponseDTO>> assignReviewer(
            @RequestBody ReviewerAssignRequestDTO request) {
        ReviewerAssignmentResponseDTO result = defenseService.assignReviewer(request);
        return ResponseEntity.ok(ApiResponse.success("Phân công Giảng viên phản biện thành công", result));
    }

    /**
     * Tra cứu danh sách phân công phản biện
     */
    @GetMapping("/reviewers")
    public ResponseEntity<ApiResponse<List<ReviewerAssignmentResponseDTO>>> getReviewers(
            @RequestParam(required = false) Long reviewerId,
            @RequestParam(required = false) String status) {
        List<ReviewerAssignmentResponseDTO> result = defenseService.getReviewerAssignments(reviewerId, status);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 3. API Tự động sinh lịch bảo vệ (Auto Schedule)
     */
    @PostMapping("/schedules/auto-generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<List<DefenseScheduleResponseDTO>>> autoGenerateSchedules(
            @RequestBody AutoScheduleRequestDTO request) {
        List<DefenseScheduleResponseDTO> result = defenseService.autoGenerateSchedules(request);
        return ResponseEntity.ok(ApiResponse.success("Tự động sinh lịch bảo vệ thành công", result));
    }

    /**
     * Cấu hình tham số lịch bảo vệ thủ công (kèm chọn danh sách SV đủ điều kiện)
     */
    @PostMapping("/schedules/configure")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<DefenseScheduleResponseDTO>> configureSchedule(
            @RequestBody ScheduleConfigDTO config) {
        DefenseScheduleResponseDTO result = defenseService.configureSchedule(config);
        return ResponseEntity.ok(ApiResponse.success("Cấu hình lịch bảo vệ thành công", result));
    }

    /**
     * Chỉnh sửa lịch bảo vệ và danh sách sinh viên trong ca bảo vệ (#16)
     */
    @PutMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<DefenseScheduleResponseDTO>> updateSchedule(
            @PathVariable Long id,
            @RequestBody ScheduleConfigDTO config) {
        DefenseScheduleResponseDTO result = defenseService.updateSchedule(id, config);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch bảo vệ thành công", result));
    }

    /**
     * Xóa ca lịch bảo vệ (#16)
     */
    @DeleteMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id) {
        defenseService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa ca lịch bảo vệ thành công", null));
    }

    /**
     * Tra cứu lịch bảo vệ theo ngày hoặc theo đợt
     */
    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<List<DefenseScheduleResponseDTO>>> getSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long projectRoundId) {
        List<DefenseScheduleResponseDTO> result = defenseService.getSchedules(date, projectRoundId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Danh sách đề tài được phép xem / chấm điểm ở GĐ5 theo đúng vai trò người đăng nhập (#17)
     */
    @GetMapping("/my-scoring-theses")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE', 'ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<List<MyScoringThesisDTO>>> getMyScoringTheses(
            @RequestParam(required = false) Long projectRoundId) {
        Long userId = currentUserId();
        boolean isAdmin = isCurrentUserAdmin();
        List<MyScoringThesisDTO> result = defenseService.getMyScoringTheses(projectRoundId, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 4. API Chấm điểm và nhập nhận xét của Hội đồng / GVHD / GVPB (KHÔNG cho phép Admin chấm điểm - #20)
     */
    @PostMapping("/scores")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE')")
    public ResponseEntity<ApiResponse<ScoreResponseDTO>> submitScore(
            @RequestBody ScoreSubmitRequestDTO request) {
        Long userId = currentUserId();
        ScoreResponseDTO result = (userId == null)
                ? defenseService.submitScore(request)
                : defenseService.submitScore(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm đánh giá thành công", result));
    }

    /**
     * Tra cứu điểm số của đề tài
     */
    @GetMapping("/scores")
    public ResponseEntity<ApiResponse<List<ScoreResponseDTO>>> getScores(
            @RequestParam Long thesisId) {
        List<ScoreResponseDTO> result = defenseService.getScoresByThesis(thesisId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Xem trạng thái chữ ký của 5 thành viên Hội đồng trên biên bản bảo vệ (#22, #23)
     */
    @GetMapping("/results/{thesisId}/signatures")
    public ResponseEntity<ApiResponse<List<MinutesSignatureItemDTO>>> getMinutesSignatures(
            @PathVariable Long thesisId) {
        List<MinutesSignatureItemDTO> result = defenseService.getMinutesSignatures(thesisId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Thành viên Hội đồng ký số xác nhận Biên bản bảo vệ (#22, #23)
     */
    @PostMapping("/results/{thesisId}/sign-minutes")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE')")
    public ResponseEntity<ApiResponse<List<MinutesSignatureItemDTO>>> signMinutes(
            @PathVariable Long thesisId) {
        Long userId = currentUserId();
        List<MinutesSignatureItemDTO> result = defenseService.signMinutes(thesisId, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã ký xác nhận Biên bản bảo vệ thành công", result));
    }

    /**
     * 5. API Tổng hợp điểm, xuất kết quả tốt nghiệp cuối kỳ
     */
    @PostMapping("/results/synthesize")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<GraduationResultResponseDTO>> synthesizeResult(
            @RequestBody SynthesizeResultRequestDTO request) {
        GraduationResultResponseDTO result = defenseService.synthesizeResult(request);
        return ResponseEntity.ok(ApiResponse.success("Tổng hợp kết quả tốt nghiệp thành công", result));
    }

    /**
     * Ký xuất Dữ liệu, công bố kết quả cho toàn bộ Sinh viên và hoàn tất đóng đợt đồ án (#25)
     */
    @PostMapping("/rounds/{roundId}/finalize-and-publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    public ResponseEntity<ApiResponse<List<GraduationResultResponseDTO>>> finalizeAndPublishRound(
            @PathVariable Long roundId) {
        List<GraduationResultResponseDTO> result = defenseService.finalizeAndPublishRound(roundId);
        return ResponseEntity.ok(ApiResponse.success("Đã công bố kết quả bảo vệ chính thức và hoàn tất Đợt đồ án!", result));
    }

    /**
     * Xem kết quả tốt nghiệp của đề tài
     */
    @GetMapping("/results/{thesisId}")
    public ResponseEntity<ApiResponse<GraduationResultResponseDTO>> getResultByThesis(
            @PathVariable Long thesisId) {
        GraduationResultResponseDTO result = defenseService.getGraduationResultByThesis(thesisId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
