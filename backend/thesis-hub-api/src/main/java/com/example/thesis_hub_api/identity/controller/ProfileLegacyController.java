package com.example.thesis_hub_api.identity.controller;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.dto.request.UpdateProfileRequestDTO;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Profile Compatibility", description = "Endpoints cung cấp hồ sơ người dùng tương thích với frontend giao diện sinh viên & giảng viên")
public class ProfileLegacyController {

    private final UserService userService;

    @GetMapping("/api/v1/students/profile")
    @Operation(summary = "Lấy thông tin hồ sơ sinh viên đăng nhập")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Map<String, Object> profile = userService.getStudentProfileForFrontend(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/api/v1/supervisors/profile")
    @Operation(summary = "Lấy thông tin hồ sơ giảng viên hướng dẫn đăng nhập")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupervisorProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Map<String, Object> profile = userService.getSupervisorProfileForFrontend(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PatchMapping("/api/v1/supervisors/profile")
    @Operation(summary = "Cập nhật thông tin hồ sơ giảng viên")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSupervisorProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody UpdateProfileRequestDTO dto) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        userService.updateCurrentUserProfile(currentUser.getId(), dto);
        Map<String, Object> profile = userService.getSupervisorProfileForFrontend(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", profile));
    }

    @GetMapping("/api/v1/committee-members/profile")
    @Operation(summary = "Lấy thông tin hồ sơ thành viên hội đồng đăng nhập")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCommitteeMemberProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Map<String, Object> profile = userService.getSupervisorProfileForFrontend(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/api/v1/externals/profile")
    @Operation(summary = "Lấy thông tin hồ sơ cán bộ ngoài trường đăng nhập")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExternalProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Map<String, Object> profile = userService.getSupervisorProfileForFrontend(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
