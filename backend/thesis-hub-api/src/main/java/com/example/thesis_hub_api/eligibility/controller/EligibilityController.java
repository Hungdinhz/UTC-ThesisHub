package com.example.thesis_hub_api.eligibility.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.eligibility.dto.*;
import com.example.thesis_hub_api.eligibility.service.EligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/eligibility")
@RequiredArgsConstructor
public class EligibilityController {

    private final EligibilityService eligibilityService;

    /**
     * API kiểm tra điều kiện làm đồ án tốt nghiệp
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<EligibilityCheckResponseDTO>> checkThesisEligibility(
            @RequestParam Long studentId,
            @RequestParam(required = false) Long projectRoundId) {
        EligibilityCheckResponseDTO result = eligibilityService.checkThesisEligibility(studentId, projectRoundId);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra điều kiện đồ án thành công", result));
    }

    /**
     * API duyệt đặc cách (Force Approve) sinh viên vào đợt làm đồ án
     */
    @PostMapping("/force-approve")
    public ResponseEntity<ApiResponse<EligibilityCheckResponseDTO>> forceApprove(
            @RequestBody ForceApproveRequestDTO request) {
        EligibilityCheckResponseDTO result = eligibilityService.forceApprove(request);
        return ResponseEntity.ok(ApiResponse.success("Duyệt đặc cách sinh viên thành công", result));
    }

    /**
     * API loại sinh viên khỏi đợt làm đồ án
     */
    @PostMapping("/disqualify")
    public ResponseEntity<ApiResponse<EligibilityCheckResponseDTO>> disqualify(
            @RequestBody DisqualifyRequestDTO request) {
        EligibilityCheckResponseDTO result = eligibilityService.disqualify(request);
        return ResponseEntity.ok(ApiResponse.success("Đã loại sinh viên khỏi đợt làm đồ án", result));
    }

    /**
     * API gửi đơn bảo lưu (Sinh viên)
     */
    @PostMapping("/reservations")
    public ResponseEntity<ApiResponse<ReservationResponseDTO>> submitReservation(
            @RequestBody ReservationSubmitRequestDTO request) {
        ReservationResponseDTO result = eligibilityService.submitReservation(request);
        return ResponseEntity.ok(ApiResponse.success("Gửi đơn bảo lưu thành công", result));
    }

    /**
     * API Khoa phê duyệt hoặc từ chối đơn bảo lưu
     */
    @PutMapping("/reservations/{id}/review")
    public ResponseEntity<ApiResponse<ReservationResponseDTO>> reviewReservation(
            @PathVariable Long id,
            @RequestBody ReservationReviewRequestDTO request) {
        ReservationResponseDTO result = eligibilityService.reviewReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success("Xử lý đơn bảo lưu thành công", result));
    }

    /**
     * API tra cứu danh sách đơn bảo lưu
     */
    @GetMapping("/reservations")
    public ResponseEntity<ApiResponse<List<ReservationResponseDTO>>> getReservations(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long projectRoundId,
            @RequestParam(required = false) String status) {
        List<ReservationResponseDTO> result = eligibilityService.getReservations(studentId, projectRoundId, status);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * API xem chi tiết đơn bảo lưu theo ID
     */
    @GetMapping("/reservations/{id}")
    public ResponseEntity<ApiResponse<ReservationResponseDTO>> getReservationById(@PathVariable Long id) {
        ReservationResponseDTO result = eligibilityService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * API xét điều kiện bảo vệ cuối kỳ
     */
    @GetMapping("/final-defense")
    public ResponseEntity<ApiResponse<FinalDefenseEligibilityResponseDTO>> checkFinalDefenseEligibility(
            @RequestParam(required = false) Long thesisId,
            @RequestParam(required = false) Long studentId) {
        FinalDefenseEligibilityResponseDTO result = eligibilityService.checkFinalDefenseEligibility(thesisId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Xét điều kiện bảo vệ cuối kỳ thành công", result));
    }
}
