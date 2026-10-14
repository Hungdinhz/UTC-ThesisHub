package com.example.thesis_hub_api.organization.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.organization.dto.request.MajorRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.MajorResponseDTO;
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
@RequestMapping("/api/v1/majors")
@RequiredArgsConstructor
@Tag(name = "Major Management", description = "Các API tra cứu và quản lý danh mục Ngành học")
public class MajorController {

    private final OrganizationService organizationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Ngành đào tạo", description = "Có thể lọc theo Khoa hoặc Bộ môn")
    public ResponseEntity<ApiResponse<List<MajorResponseDTO>>> getMajors(
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) Long departmentId) {
        List<MajorResponseDTO> list = organizationService.getMajors(facultyId, departmentId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một Ngành đào tạo")
    public ResponseEntity<ApiResponse<MajorResponseDTO>> getMajorById(@PathVariable Long id) {
        MajorResponseDTO major = organizationService.getMajorById(id);
        return ResponseEntity.ok(ApiResponse.success(major));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Thêm mới Ngành đào tạo (Admin)")
    public ResponseEntity<ApiResponse<MajorResponseDTO>> createMajor(
            @Valid @RequestBody MajorRequestDTO dto) {
        MajorResponseDTO created = organizationService.createMajor(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới ngành thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin Ngành đào tạo (Admin)")
    public ResponseEntity<ApiResponse<MajorResponseDTO>> updateMajor(
            @PathVariable Long id,
            @Valid @RequestBody MajorRequestDTO dto) {
        MajorResponseDTO updated = organizationService.updateMajor(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin ngành thành công", updated));
    }
}
