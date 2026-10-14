package com.example.thesis_hub_api.organization.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.organization.dto.request.DepartmentRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.DepartmentResponseDTO;
import com.example.thesis_hub_api.organization.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Department Management", description = "Các API tra cứu và quản lý danh mục Bộ môn")
public class DepartmentController {

    private final OrganizationService organizationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Bộ môn", description = "Có thể lọc theo Khoa bằng query parameter facultyId")
    public ResponseEntity<ApiResponse<List<DepartmentResponseDTO>>> getDepartments(
            @RequestParam(required = false) Long facultyId) {
        List<DepartmentResponseDTO> list = organizationService.getDepartments(facultyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một Bộ môn")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> getDepartmentById(@PathVariable Long id) {
        DepartmentResponseDTO department = organizationService.getDepartmentById(id);
        return ResponseEntity.ok(ApiResponse.success(department));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Thêm mới Bộ môn (Admin)")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> createDepartment(
            @Valid @RequestBody DepartmentRequestDTO dto) {
        DepartmentResponseDTO created = organizationService.createDepartment(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới bộ môn thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin Bộ môn (Admin)")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequestDTO dto) {
        DepartmentResponseDTO updated = organizationService.updateDepartment(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin bộ môn thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Xóa Bộ môn (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        organizationService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bộ môn thành công", null));
    }
}
