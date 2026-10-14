package com.example.thesis_hub_api.projectround.controller;

import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.projectround.dto.request.AcademicRecordImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportPreviewResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordImportResultResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.AcademicRecordResponseDTO;
import com.example.thesis_hub_api.projectround.service.AcademicRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Academic Records Management", description = "Các API Import dữ liệu học vụ xét điều kiện (Phase 4 Ingestion & Contract 4)")
public class AcademicRecordController {

    private final AcademicRecordService academicRecordService;

    @GetMapping("/project-rounds/academic-records/template")
    @Operation(summary = "Tải file Excel mẫu import dữ liệu học vụ xét điều kiện chuẩn UTC")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] excelBytes = academicRecordService.generateTemplate();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau_import_hoc_vu_utc.xlsx\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @PostMapping(value = "/project-rounds/{roundId}/academic-records/import-preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xem trước phân tích dữ liệu file Excel học vụ")
    public ResponseEntity<ApiResponse<AcademicRecordImportPreviewResponseDTO>> previewImport(
            @PathVariable Long roundId,
            @RequestParam("file") MultipartFile file) {

        AcademicRecordImportPreviewResponseDTO preview = academicRecordService.previewImport(roundId, file);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/project-rounds/{roundId}/academic-records/import-commit")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xác nhận lưu trữ kết quả học vụ vào CSDL")
    public ResponseEntity<ApiResponse<AcademicRecordImportResultResponseDTO>> commitImport(
            @PathVariable Long roundId,
            @Valid @RequestBody AcademicRecordImportCommitRequestDTO requestDTO) {

        AcademicRecordImportResultResponseDTO result = academicRecordService.commitImport(roundId, requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    @GetMapping("/project-rounds/{roundId}/academic-records")
    @Operation(summary = "Lấy danh sách dữ liệu học vụ trong đợt đồ án (phân trang và lọc)")
    public ResponseEntity<ApiResponse<PageResponse<AcademicRecordResponseDTO>>> getAcademicRecords(
            @PathVariable Long roundId,
            @RequestParam(required = false) Boolean tuitionDebt,
            @RequestParam(required = false) Boolean underDisciplinaryAction,
            @RequestParam(required = false) String search,
            @PageableDefault(page = 0, size = 20, sort = "importedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<AcademicRecordResponseDTO> response = academicRecordService.getAcademicRecords(
                roundId, tuitionDebt, underDisciplinaryAction, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * CONTRACT 4: API Chi tiết Kết quả học vụ của một sinh viên trong đợt đồ án.
     * Cung cấp trực tiếp cho module Eligibility của Khoa (Khuất Đăng Khoa) thay thế mock service.
     */
    @GetMapping("/project-rounds/{roundId}/academic-records/{studentId}")
    @Operation(
            summary = "Tra cứu kết quả học vụ của sinh viên trong đợt đồ án (Contract 4)",
            description = "Trả về thông tin số tín chỉ tích lũy, GPA, nợ học phí, kỷ luật, số môn tiên quyết phục vụ xét điều kiện"
    )
    public ResponseEntity<ApiResponse<AcademicRecordResponseDTO>> getStudentAcademicRecord(
            @PathVariable Long roundId,
            @PathVariable Long studentId) {

        AcademicRecordResponseDTO record = academicRecordService.getStudentAcademicRecord(roundId, studentId);
        return ResponseEntity.ok(ApiResponse.success(record));
    }

    @GetMapping("/academic-records/student/{studentId}")
    @Operation(summary = "Tra cứu kết quả học vụ gần nhất của sinh viên theo studentId")
    public ResponseEntity<ApiResponse<AcademicRecordResponseDTO>> getRecordByStudentId(@PathVariable Long studentId) {
        AcademicRecordResponseDTO record = academicRecordService.getRecordByStudentId(studentId);
        return ResponseEntity.ok(ApiResponse.success(record));
    }
}
