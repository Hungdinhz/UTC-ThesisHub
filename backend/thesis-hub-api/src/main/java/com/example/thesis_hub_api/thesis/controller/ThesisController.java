package com.example.thesis_hub_api.thesis.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.thesis.dto.ThesisResponse;
import com.example.thesis_hub_api.thesis.dto.UpdateThesisRequest;
import com.example.thesis_hub_api.thesis.service.ThesisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/theses")
@RequiredArgsConstructor
public class ThesisController {

    private final ThesisService thesisService;

    @GetMapping("/{id}")
    public ApiResponse<ThesisResponse> getThesisById(@PathVariable Long id) {
        return ApiResponse.success(thesisService.getThesisById(id));
    }

    @GetMapping("/by-code/{code}")
    public ApiResponse<ThesisResponse> getThesisByCode(@PathVariable String code) {
        return ApiResponse.success(thesisService.getThesisByCode(code));
    }

    @GetMapping("/by-student-and-round")
    public ApiResponse<ThesisResponse> getThesisByStudentAndRound(
            @RequestParam Long studentId,
            @RequestParam Long roundId) {
        return ApiResponse.success(thesisService.getThesisByStudentAndRound(studentId, roundId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE', 'ADMIN')")
    public ApiResponse<ThesisResponse> updateThesis(
            @PathVariable Long id,
            @Valid @RequestBody UpdateThesisRequest request) {
        return ApiResponse.success("Cập nhật đề tài thành công", thesisService.updateThesis(id, request));
    }

    @PatchMapping("/{id}/completion-rate")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE', 'ADMIN')")
    public ApiResponse<ThesisResponse> updateCompletionRate(
            @PathVariable Long id,
            @RequestParam BigDecimal rate) {
        return ApiResponse.success("Cập nhật tiến độ hoàn thành đề tài thành công",
                thesisService.updateCompletionRate(id, rate));
    }

    @PatchMapping("/{id}/defense-eligible")
    @PreAuthorize("hasAnyRole('LECTURER', 'COMMITTEE', 'ADMIN')")
    public ApiResponse<ThesisResponse> setDefenseEligible(
            @PathVariable Long id,
            @RequestParam boolean eligible) {
        return ApiResponse.success("Cập nhật điều kiện bảo vệ thành công",
                thesisService.setDefenseEligible(id, eligible));
    }

    @GetMapping
    public ApiResponse<Page<ThesisResponse>> searchTheses(
            @RequestParam(required = false) Long roundId,
            @RequestParam(required = false) Long lecturerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean defenseEligible,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ApiResponse.success(thesisService.searchTheses(roundId, lecturerId, status, defenseEligible, search, pageable));
    }
}
