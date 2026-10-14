package com.example.thesis_hub_api.organization.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.organization.dto.request.TrainingProgramRequestDTO;
import com.example.thesis_hub_api.organization.dto.response.TrainingProgramResponseDTO;
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
@RequestMapping("/api/v1/training-programs")
@RequiredArgsConstructor
@Tag(name = "Training Program Management", description = "Các API tra cứu và quản lý Chương trình đào tạo")
public class TrainingProgramController {

    private final OrganizationService organizationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các Chương trình đào tạo (Cử nhân, Kỹ sư...)")
    public ResponseEntity<ApiResponse<List<TrainingProgramResponseDTO>>> getAllTrainingPrograms() {
        List<TrainingProgramResponseDTO> list = organizationService.getAllTrainingPrograms();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một Chương trình đào tạo")
    public ResponseEntity<ApiResponse<TrainingProgramResponseDTO>> getTrainingProgramById(@PathVariable Long id) {
        TrainingProgramResponseDTO tp = organizationService.getTrainingProgramById(id);
        return ResponseEntity.ok(ApiResponse.success(tp));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Thêm mới Chương trình đào tạo (Admin)")
    public ResponseEntity<ApiResponse<TrainingProgramResponseDTO>> createTrainingProgram(
            @Valid @RequestBody TrainingProgramRequestDTO dto) {
        TrainingProgramResponseDTO created = organizationService.createTrainingProgram(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới chương trình đào tạo thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Cập nhật thông tin Chương trình đào tạo (Admin)")
    public ResponseEntity<ApiResponse<TrainingProgramResponseDTO>> updateTrainingProgram(
            @PathVariable Long id,
            @Valid @RequestBody TrainingProgramRequestDTO dto) {
        TrainingProgramResponseDTO updated = organizationService.updateTrainingProgram(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin chương trình đào tạo thành công", updated));
    }
}
