package com.example.thesis_hub_api.identity.controller;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.dto.request.ChangePasswordRequestDTO;
import com.example.thesis_hub_api.identity.dto.request.LoginRequestDTO;
import com.example.thesis_hub_api.identity.dto.response.LoginResponseDTO;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Các API xác thực, đăng nhập, đổi mật khẩu và cấp phát token")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống chung", description = "Đăng nhập bằng username, email hoặc mã số")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/students/login")
    @Operation(summary = "Đăng nhập dành cho sinh viên", description = "Alias tương thích frontend dành cho sinh viên UTC")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> studentLogin(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập sinh viên thành công", response));
    }

    @PostMapping("/supervisors/login")
    @Operation(summary = "Đăng nhập dành cho giảng viên hướng dẫn", description = "Alias tương thích frontend dành cho giảng viên")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> supervisorLogin(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập giảng viên thành công", response));
    }

    @PostMapping("/committee-members/login")
    @Operation(summary = "Đăng nhập dành cho thành viên hội đồng", description = "Alias tương thích frontend dành cho hội đồng chấm thi")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> committeeMemberLogin(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập hội đồng thành công", response));
    }

    @PostMapping("/externals/login")
    @Operation(summary = "Đăng nhập dành cho cán bộ chấm ngoài trường", description = "Alias tương thích frontend")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> externalLogin(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu người dùng hiện tại", description = "Yêu cầu mật khẩu cũ và xác thực Bearer token")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequestDTO request) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        authService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất tài khoản", description = "Hủy phiên đăng nhập ở client")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới JWT token", description = "Cấp mới token từ token hiện tại")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> refreshToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        LoginResponseDTO response = authService.refreshToken(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
    }
}
