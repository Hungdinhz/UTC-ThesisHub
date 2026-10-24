package com.example.thesis_hub_api.organization.controller;

import com.example.thesis_hub_api.common.exception.AppException;
import com.example.thesis_hub_api.common.exception.ErrorCode;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.organization.dto.request.CreateLecturerRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateLecturerRequestDTO;
import com.example.thesis_hub_api.organization.dto.request.UpdateResearchInterestsDTO;
import com.example.thesis_hub_api.organization.dto.response.LecturerResponseDTO;
import com.example.thesis_hub_api.organization.service.LecturerService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/lecturers")
@RequiredArgsConstructor
@Tag(name = "Lecturer Management", description = "Các API tra cứu, quản lý giảng viên và hướng nghiên cứu (Contract 1)")
public class LecturerController {

    private final LecturerService lecturerService;

    /**
     * CONTRACT 1: API Tra cứu Giảng viên theo Bộ môn / Hướng nghiên cứu / Học vị.
     * Cung cấp dữ liệu nền cho module phân công hướng dẫn (Nguyễn Đình Công) và hội đồng bảo vệ (Khuất Đăng Khoa).
     */
    @GetMapping
    @Operation(
            summary = "Tra cứu danh sách Giảng viên (Contract 1)",
            description = "Hỗ trợ lọc theo bộ môn, học vị, đợt đồ án và tìm kiếm theo tên hoặc mã CB. Trả về danh sách để phục vụ ghép chỉ tiêu và hội đồng."
    )
    public ResponseEntity<ApiResponse<List<LecturerResponseDTO>>> getLecturers(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long projectRoundId) {
        List<LecturerResponseDTO> lecturers = lecturerService.getLecturers(departmentId, degree, search, projectRoundId);
        return ResponseEntity.ok(ApiResponse.success(lecturers));
    }

    @GetMapping("/paged")
    @Operation(summary = "Danh sách Giảng viên phân trang (Dành cho Admin UI)")
    public ResponseEntity<ApiResponse<PageResponse<LecturerResponseDTO>>> getLecturersPaged(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long projectRoundId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sort) {
        
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = (sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        PageResponse<LecturerResponseDTO> result = lecturerService.getLecturersPaged(departmentId, degree, search, projectRoundId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một Giảng viên")
    public ResponseEntity<ApiResponse<LecturerResponseDTO>> getLecturerById(@PathVariable Long id) {
        LecturerResponseDTO lecturer = lecturerService.getLecturerById(id);
        return ResponseEntity.ok(ApiResponse.success(lecturer));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Tạo mới Giảng viên (Admin)", description = "Tạo tài khoản người dùng và hồ sơ giảng viên")
    public ResponseEntity<ApiResponse<LecturerResponseDTO>> createLecturer(
            @Valid @RequestBody CreateLecturerRequestDTO dto) {
        LecturerResponseDTO created = lecturerService.createLecturer(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới giảng viên thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin Giảng viên (Admin)")
    public ResponseEntity<ApiResponse<LecturerResponseDTO>> updateLecturer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLecturerRequestDTO dto) {
        LecturerResponseDTO updated = lecturerService.updateLecturer(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin giảng viên thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Xóa thông tin giảng viên (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteLecturer(@PathVariable Long id) {
        lecturerService.deleteLecturer(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa giảng viên thành công", null));
    }

    @PutMapping("/me/research-interests")
    @PreAuthorize("hasAnyAuthority('ROLE_LECTURER', 'ROLE_COMMITTEE')")
    @Operation(summary = "Giảng viên tự cập nhật Hướng nghiên cứu cá nhân")
    public ResponseEntity<ApiResponse<LecturerResponseDTO>> updateMyResearchInterests(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateResearchInterestsDTO dto) {
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        LecturerResponseDTO updated = lecturerService.updateMyResearchInterests(currentUser.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hướng nghiên cứu thành công", updated));
    }
}
