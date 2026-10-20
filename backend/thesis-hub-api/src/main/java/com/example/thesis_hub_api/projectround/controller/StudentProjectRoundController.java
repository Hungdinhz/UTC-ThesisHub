package com.example.thesis_hub_api.projectround.controller;

import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.projectround.dto.request.CreateRoundStudentManualDTO;
import com.example.thesis_hub_api.projectround.dto.request.StudentImportCommitRequestDTO;
import com.example.thesis_hub_api.projectround.dto.request.UpdateStudentRoundStatusRequestDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportPreviewResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentImportResultResponseDTO;
import com.example.thesis_hub_api.projectround.dto.response.StudentProjectRoundResponseDTO;
import com.example.thesis_hub_api.projectround.service.StudentProjectRoundService;
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
@RequestMapping("/api/v1/project-rounds")
@RequiredArgsConstructor
@Tag(name = "Student Project Round Management", description = "Các API Ingestion danh sách sinh viên qua Excel và tra cứu sinh viên trong đợt đồ án (Contract 3)")
public class StudentProjectRoundController {

    private final StudentProjectRoundService studentProjectRoundService;

    @GetMapping("/students/template")
    @Operation(summary = "Tải file Excel mẫu import sinh viên chuẩn UTC (8 cột)")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] excelBytes = studentProjectRoundService.generateTemplate();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mau_import_sinh_vien_utc.xlsx\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @PostMapping(value = "/{roundId}/students/import-preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(
            summary = "Xem trước (preview) phân tích file Excel import sinh viên",
            description = "Phân tích file Excel, đối soát mã ngành, trùng lặp và tính hợp lệ từng dòng trước khi commit"
    )
    public ResponseEntity<ApiResponse<StudentImportPreviewResponseDTO>> previewImportStudents(
            @PathVariable Long roundId,
            @RequestParam("file") MultipartFile file) {

        StudentImportPreviewResponseDTO preview = studentProjectRoundService.previewImportStudents(roundId, file);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/{roundId}/students/import-commit")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(
            summary = "Xác nhận ghi dữ liệu (commit) sinh viên vào đợt đồ án",
            description = "Tự động tạo tài khoản User (ROLE_STUDENT), hồ sơ Student và ghi danh vào đợt với trạng thái ELIGIBLE"
    )
    public ResponseEntity<ApiResponse<StudentImportResultResponseDTO>> commitImportStudents(
            @PathVariable Long roundId,
            @Valid @RequestBody StudentImportCommitRequestDTO requestDTO) {

        StudentImportResultResponseDTO result = studentProjectRoundService.commitImportStudents(roundId, requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    @PostMapping("/{roundId}/students/manual")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Thêm sinh viên thủ công vào đợt đồ án (Tự động cấp tài khoản MSSV/MSSV)")
    public ResponseEntity<ApiResponse<StudentProjectRoundResponseDTO>> addStudentManually(
            @PathVariable Long roundId,
            @Valid @RequestBody CreateRoundStudentManualDTO dto) {

        StudentProjectRoundResponseDTO response = studentProjectRoundService.addStudentManually(roundId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Thêm sinh viên vào đợt thành công", response));
    }

    /**
     * CONTRACT 3: API Lấy danh sách sinh viên trong đợt đồ án có phân trang và lọc theo ngành, trạng thái, từ khóa.
     * Cung cấp cho thành viên Nguyễn Đình Công (phân công GVHD) & Ngô Minh Quyết (hội đồng bảo vệ).
     */
    @GetMapping("/{roundId}/students")
    @Operation(
            summary = "Tra cứu danh sách sinh viên trong đợt đồ án (Contract 3)",
            description = "Hỗ trợ phân trang, lọc theo majorId, status và tìm kiếm theo MSSV/họ tên/lớp/email"
    )
    public ResponseEntity<ApiResponse<PageResponse<StudentProjectRoundResponseDTO>>> getStudentsInRound(
            @PathVariable Long roundId,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(page = 0, size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<StudentProjectRoundResponseDTO> response = studentProjectRoundService.getStudentsInRound(
                roundId, majorId, status, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{roundId}/students/{studentId}")
    @Operation(summary = "Xem thông tin chi tiết một sinh viên trong đợt đồ án")
    public ResponseEntity<ApiResponse<StudentProjectRoundResponseDTO>> getStudentRoundDetail(
            @PathVariable Long roundId,
            @PathVariable Long studentId) {

        StudentProjectRoundResponseDTO detail = studentProjectRoundService.getStudentRoundDetail(roundId, studentId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PatchMapping("/{roundId}/students/{studentId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Cập nhật trạng thái và ghi chú của sinh viên trong đợt đồ án")
    public ResponseEntity<ApiResponse<StudentProjectRoundResponseDTO>> updateStudentRoundStatus(
            @PathVariable Long roundId,
            @PathVariable Long studentId,
            @Valid @RequestBody UpdateStudentRoundStatusRequestDTO requestDTO) {

        StudentProjectRoundResponseDTO updated = studentProjectRoundService.updateStudentRoundStatus(
                roundId, studentId, requestDTO);

        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{roundId}/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY_ADMIN')")
    @Operation(summary = "Xóa sinh viên khỏi đợt đồ án")
    public ResponseEntity<ApiResponse<Void>> removeStudentFromRound(
            @PathVariable Long roundId,
            @PathVariable Long studentId) {

        studentProjectRoundService.removeStudentFromRound(roundId, studentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
