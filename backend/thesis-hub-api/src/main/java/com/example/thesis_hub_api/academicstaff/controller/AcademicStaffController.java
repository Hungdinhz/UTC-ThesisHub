package com.example.thesis_hub_api.academicstaff.controller;

import com.example.thesis_hub_api.academicstaff.dto.ClassGradeReportResponseDTO;
import com.example.thesis_hub_api.academicstaff.dto.EligibleStudentListResponseDTO;
import com.example.thesis_hub_api.academicstaff.service.AcademicStaffService;
import com.example.thesis_hub_api.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academic-staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ACADEMIC_STAFF', 'ADMIN')")
@Tag(name = "Academic Staff", description = "Nghiệp vụ Giáo vụ khoa: danh sách đủ điều kiện nhận đồ án, in điểm đồ án theo lớp")
public class AcademicStaffController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final AcademicStaffService academicStaffService;

    @GetMapping("/rounds/{roundId}/eligible-students")
    @Operation(summary = "Danh sách sinh viên đủ điều kiện nhận đồ án trong đợt (nợ tín chỉ < ngưỡng)")
    public ResponseEntity<ApiResponse<EligibleStudentListResponseDTO>> getEligibleStudents(
            @PathVariable Long roundId,
            @RequestParam(defaultValue = "false") boolean onlyEligible) {
        return ResponseEntity.ok(ApiResponse.success(academicStaffService.getEligibleStudents(roundId, onlyEligible)));
    }

    @GetMapping("/rounds/{roundId}/eligible-students/export")
    @Operation(summary = "Xuất Excel danh sách đủ điều kiện nhận đồ án (kèm sheet không đủ điều kiện)")
    public ResponseEntity<byte[]> exportEligibleStudents(@PathVariable Long roundId) {
        byte[] bytes = academicStaffService.exportEligibleStudents(roundId);
        String fileName = "danh_sach_du_dieu_kien_nhan_do_an_" + safeFileName(academicStaffService.getRoundCode(roundId)) + ".xlsx";
        return excel(bytes, fileName);
    }

    @GetMapping("/rounds/{roundId}/classes")
    @Operation(summary = "Danh sách lớp có điểm đồ án đã công bố trong đợt")
    public ResponseEntity<ApiResponse<List<String>>> getClasses(@PathVariable Long roundId) {
        return ResponseEntity.ok(ApiResponse.success(academicStaffService.getClassNames(roundId)));
    }

    @GetMapping("/rounds/{roundId}/grades")
    @Operation(summary = "Danh sách điểm đồ án đã công bố, nhóm theo lớp (lọc theo className nếu có)")
    public ResponseEntity<ApiResponse<ClassGradeReportResponseDTO>> getGrades(
            @PathVariable Long roundId,
            @RequestParam(required = false) String className) {
        return ResponseEntity.ok(ApiResponse.success(academicStaffService.buildGradeReport(roundId, className)));
    }

    @GetMapping("/rounds/{roundId}/grades/export")
    @Operation(summary = "Xuất Excel danh sách điểm đồ án theo lớp (mỗi lớp một sheet)")
    public ResponseEntity<byte[]> exportGrades(
            @PathVariable Long roundId,
            @RequestParam(required = false) String className) {
        byte[] bytes = academicStaffService.exportClassGrades(roundId, className);
        String fileName = "diem_do_an_" + safeFileName(academicStaffService.getRoundCode(roundId))
                + (className != null && !className.isBlank() ? "_" + safeFileName(className) : "") + ".xlsx";
        return excel(bytes, fileName);
    }

    private ResponseEntity<byte[]> excel(byte[] bytes, String fileName) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(XLSX)
                .body(bytes);
    }

    private String safeFileName(String raw) {
        return raw == null ? "" : raw.trim().replaceAll("[^A-Za-z0-9_-]+", "_");
    }
}
