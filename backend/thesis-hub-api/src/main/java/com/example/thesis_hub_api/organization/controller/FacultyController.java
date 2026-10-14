package com.example.thesis_hub_api.organization.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.organization.dto.request.FacultyRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.DepartmentResponseDTO;
import com.example.thesis_hub_api.organization.dto.response.FacultyResponseDTO;
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
@RequestMapping("/api/v1/faculties")
@RequiredArgsConstructor
@Tag(name = "Faculty Management", description = "Các API tra cứu và quản lý danh mục Khoa")
public class FacultyController {

    private final OrganizationService organizationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các Khoa")
    public ResponseEntity<ApiResponse<List<FacultyResponseDTO>>> getAllFaculties() {
        List<FacultyResponseDTO> faculties = organizationService.getAllFaculties();
        return ResponseEntity.ok(ApiResponse.success(faculties));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một Khoa")
    public ResponseEntity<ApiResponse<FacultyResponseDTO>> getFacultyById(@PathVariable Long id) {
        FacultyResponseDTO faculty = organizationService.getFacultyById(id);
        return ResponseEntity.ok(ApiResponse.success(faculty));
    }

    @GetMapping("/{id}/departments")
    @Operation(summary = "Lấy danh sách Bộ môn trực thuộc Khoa")
    public ResponseEntity<ApiResponse<List<DepartmentResponseDTO>>> getDepartmentsByFaculty(@PathVariable Long id) {
        List<DepartmentResponseDTO> departments = organizationService.getDepartments(id);
        return ResponseEntity.ok(ApiResponse.success(departments));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Thêm mới Khoa (Admin)")
    public ResponseEntity<ApiResponse<FacultyResponseDTO>> createFaculty(@Valid @RequestBody FacultyRequestDTO dto) {
        FacultyResponseDTO created = organizationService.createFaculty(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới khoa thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin Khoa (Admin)")
    public ResponseEntity<ApiResponse<FacultyResponseDTO>> updateFaculty(
            @PathVariable Long id,
            @Valid @RequestBody FacultyRequestDTO dto) {
        FacultyResponseDTO updated = organizationService.updateFaculty(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin khoa thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Xóa Khoa (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteFaculty(@PathVariable Long id) {
        organizationService.deleteFaculty(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khoa thành công", null));
    }
}
