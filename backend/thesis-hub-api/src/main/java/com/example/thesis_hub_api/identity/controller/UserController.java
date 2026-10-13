package com.example.thesis_hub_api.identity.controller;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.dto.request.*;
import com.example.thesis_hub_api.identity.dto.response.UserProfileResponseDTO;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Các API quản lý tài khoản người dùng và hồ sơ cá nhân")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Lấy hồ sơ cá nhân người dùng hiện tại", description = "Lấy thông tin tài khoản, vai trò và thông tin SV/GV liên kết")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> getCurrentUserProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        UserProfileResponseDTO profile = userService.getCurrentUserProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật hồ sơ cá nhân", description = "Cập nhật họ tên, số điện thoại, avatar hoặc thông tin chuyên môn")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> updateCurrentUserProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequestDTO dto) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        UserProfileResponseDTO updated = userService.updateCurrentUserProfile(currentUser.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", updated));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Danh sách người dùng phân trang (Admin)", description = "Tìm kiếm theo từ khóa, lọc theo vai trò và trạng thái hoạt động")
    public ResponseEntity<ApiResponse<PageResponse<UserProfileResponseDTO>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        PageResponse<UserProfileResponseDTO> result = userService.getUsers(search, roleId, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Chi tiết người dùng theo ID (Admin)")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> getUserById(@PathVariable Long id) {
        UserProfileResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Tạo mới người dùng (Admin)", description = "Tạo tài khoản và tự động khởi tạo hồ sơ SV/GV nếu có")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> createUser(
            @Valid @RequestBody CreateUserRequestDTO dto) {
        UserProfileResponseDTO created = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo người dùng thành công", created));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Khóa hoặc mở khóa người dùng (Admin)")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequestDTO dto) {
        UserProfileResponseDTO updated = userService.updateUserStatus(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", updated));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Thay đổi vai trò người dùng (Admin)")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequestDTO dto) {
        UserProfileResponseDTO updated = userService.updateUserRole(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Thay đổi vai trò thành công", updated));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin đặt lại mật khẩu cho người dùng")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequestDTO dto) {
        userService.resetPassword(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }
}
