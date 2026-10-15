package com.example.thesis_hub_api.defense.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.defense.dto.*;
import com.example.thesis_hub_api.defense.service.DefenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/defense")
@RequiredArgsConstructor
public class DefenseController {

    private final DefenseService defenseService;

    /**
     * 1. API Chạy thuật toán CSP (Backtracking + Greedy) tạo Hội đồng & gán sinh viên
     */
    @PostMapping("/councils/generate")
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
     * 2. API Phân công Giảng viên phản biện (Kiểm tra ràng buộc GVPB ≠ GVHD)
     */
    @PostMapping("/reviewers/assign")
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
    public ResponseEntity<ApiResponse<List<DefenseScheduleResponseDTO>>> autoGenerateSchedules(
            @RequestBody AutoScheduleRequestDTO request) {
        List<DefenseScheduleResponseDTO> result = defenseService.autoGenerateSchedules(request);
        return ResponseEntity.ok(ApiResponse.success("Tự động sinh lịch bảo vệ thành công", result));
    }

    /**
     * Cấu hình tham số lịch bảo vệ thủ công
     */
    @PostMapping("/schedules/configure")
    public ResponseEntity<ApiResponse<DefenseScheduleResponseDTO>> configureSchedule(
            @RequestBody ScheduleConfigDTO config) {
        DefenseScheduleResponseDTO result = defenseService.configureSchedule(config);
        return ResponseEntity.ok(ApiResponse.success("Cấu hình lịch bảo vệ thành công", result));
    }

    /**
     * Tra cứu lịch bảo vệ theo ngày
     */
    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<List<DefenseScheduleResponseDTO>>> getSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<DefenseScheduleResponseDTO> result = defenseService.getSchedulesByDate(date);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 4. API Chấm điểm và nhập nhận xét của Hội đồng / GVHD / GVPB
     */
    @PostMapping("/scores")
    public ResponseEntity<ApiResponse<ScoreResponseDTO>> submitScore(
            @RequestBody ScoreSubmitRequestDTO request) {
        ScoreResponseDTO result = defenseService.submitScore(request);
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
     * 5. API Tổng hợp điểm, xuất kết quả tốt nghiệp cuối kỳ
     */
    @PostMapping("/results/synthesize")
    public ResponseEntity<ApiResponse<GraduationResultResponseDTO>> synthesizeResult(
            @RequestBody SynthesizeResultRequestDTO request) {
        GraduationResultResponseDTO result = defenseService.synthesizeResult(request);
        return ResponseEntity.ok(ApiResponse.success("Tổng hợp kết quả tốt nghiệp thành công", result));
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
