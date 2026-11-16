package com.example.thesis_hub_api.security.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.security.dto.*;
import com.example.thesis_hub_api.security.interceptor.AuditHttpInterceptor;
import com.example.thesis_hub_api.security.service.SecurityCenterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/security")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Security Center", description = "Trung tâm bảo mật: Giám sát phiên, khóa/mở khóa tài khoản, chính sách bảo mật và phân quyền RBAC")
public class SecurityCenterController {

    private final SecurityCenterService securityCenterService;

    @GetMapping("/overview")
    @Operation(summary = "Lấy tổng quan tình trạng an ninh hệ thống")
    public ResponseEntity<ApiResponse<SecurityOverviewDTO>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success("Lấy tổng quan bảo mật thành công", securityCenterService.getSecurityOverview()));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Danh sách phiên đăng nhập (Active / Revoked / Expired)")
    public ResponseEntity<ApiResponse<List<SecuritySessionDTO>>> getSessions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getSessions(status, search)));
    }

    @PostMapping("/sessions/{sessionId}/revoke")
    @Operation(summary = "Thu hồi phiên đăng nhập từ xa (Force Logout)")
    public ResponseEntity<ApiResponse<SecuritySessionDTO>> revokeSession(
            @PathVariable Long sessionId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        request.setAttribute(AuditHttpInterceptor.ATTR_LOGGED_EXPLICITLY, Boolean.TRUE);
        Long adminId = currentUser != null ? currentUser.getId() : null;
        String adminUsername = currentUser != null ? currentUser.getUsername() : "admin";
        String reason = body != null ? body.get("reason") : null;
        String ip = AuditHttpInterceptor.extractClientIp(request);

        SecuritySessionDTO dto = securityCenterService.revokeSession(sessionId, adminId, adminUsername, reason, ip);
        return ResponseEntity.ok(ApiResponse.success("Thu hồi phiên đăng nhập thành công", dto));
    }

    @PostMapping("/users/{userId}/revoke-sessions")
    @Operation(summary = "Thu hồi toàn bộ phiên đăng nhập đang hoạt động của một người dùng")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> revokeAllUserSessions(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        request.setAttribute(AuditHttpInterceptor.ATTR_LOGGED_EXPLICITLY, Boolean.TRUE);
        Long adminId = currentUser != null ? currentUser.getId() : null;
        String adminUsername = currentUser != null ? currentUser.getUsername() : "admin";
        String reason = body != null ? body.get("reason") : null;
        String ip = AuditHttpInterceptor.extractClientIp(request);

        int count = securityCenterService.revokeAllUserSessions(userId, adminId, adminUsername, reason, ip);
        return ResponseEntity.ok(ApiResponse.success("Đã thu hồi " + count + " phiên đăng nhập", Map.of("revokedCount", count)));
    }

    @GetMapping("/accounts/locked")
    @Operation(summary = "Danh sách tài khoản đang bị khóa hoặc có dấu hiệu nhập sai mật khẩu")
    public ResponseEntity<ApiResponse<List<LockedAccountDTO>>> getLockedAccounts() {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getLockedOrRiskyAccounts()));
    }

    @PostMapping("/accounts/{userId}/unlock")
    @Operation(summary = "Mở khóa bảo mật cho tài khoản")
    public ResponseEntity<ApiResponse<LockedAccountDTO>> unlockAccount(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        request.setAttribute(AuditHttpInterceptor.ATTR_LOGGED_EXPLICITLY, Boolean.TRUE);
        Long adminId = currentUser != null ? currentUser.getId() : null;
        String adminUsername = currentUser != null ? currentUser.getUsername() : "admin";
        String ip = AuditHttpInterceptor.extractClientIp(request);

        LockedAccountDTO dto = securityCenterService.unlockAccount(userId, adminId, adminUsername, ip);
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa tài khoản thành công", dto));
    }

    @PostMapping("/accounts/{userId}/lock")
    @Operation(summary = "Khóa tài khoản tạm thời hoặc vô thời hạn")
    public ResponseEntity<ApiResponse<LockedAccountDTO>> lockAccount(
            @PathVariable Long userId,
            @RequestBody(required = false) AccountLockRequestDTO body,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        request.setAttribute(AuditHttpInterceptor.ATTR_LOGGED_EXPLICITLY, Boolean.TRUE);
        Long adminId = currentUser != null ? currentUser.getId() : null;
        String adminUsername = currentUser != null ? currentUser.getUsername() : "admin";
        String ip = AuditHttpInterceptor.extractClientIp(request);

        LockedAccountDTO dto = securityCenterService.lockAccount(userId, adminId, adminUsername, body, ip);
        return ResponseEntity.ok(ApiResponse.success("Đã khóa tài khoản thành công", dto));
    }

    @GetMapping("/policies")
    @Operation(summary = "Danh sách chính sách bảo mật hệ thống")
    public ResponseEntity<ApiResponse<List<SecurityPolicyDTO>>> getPolicies() {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getPolicies()));
    }

    @PutMapping("/policies/{policyKey}")
    @Operation(summary = "Cập nhật giá trị chính sách bảo mật")
    public ResponseEntity<ApiResponse<SecurityPolicyDTO>> updatePolicy(
            @PathVariable String policyKey,
            @Valid @RequestBody UpdateSecurityPolicyRequestDTO body,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        request.setAttribute(AuditHttpInterceptor.ATTR_LOGGED_EXPLICITLY, Boolean.TRUE);
        Long adminId = currentUser != null ? currentUser.getId() : null;
        String adminUsername = currentUser != null ? currentUser.getUsername() : "admin";
        String ip = AuditHttpInterceptor.extractClientIp(request);

        SecurityPolicyDTO updated = securityCenterService.updatePolicy(policyKey, body.getPolicyValue(), adminId, adminUsername, ip);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chính sách bảo mật thành công", updated));
    }

    @GetMapping("/rbac-matrix")
    @Operation(summary = "Ma trận phân quyền chuẩn RBAC theo vai trò và phân hệ")
    public ResponseEntity<ApiResponse<List<RbacPermissionItemDTO>>> getRbacMatrix() {
        return ResponseEntity.ok(ApiResponse.success(securityCenterService.getRbacMatrix()));
    }
}
