package com.example.thesis_hub_api.security.controller;

import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.security.dto.AuditLogFilterDTO;
import com.example.thesis_hub_api.security.dto.AuditLogResponseDTO;
import com.example.thesis_hub_api.security.dto.AuditLogStatsDTO;
import com.example.thesis_hub_api.security.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "System Audit Logs", description = "Nhật ký hệ thống (Audit Trail) phục vụ kiểm toán và truy vết thay đổi dữ liệu")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "Tra cứu và lọc nhật ký hệ thống phân trang")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponseDTO>>> searchAuditLogs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String moduleName,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String actorRole,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        AuditLogFilterDTO filter = buildFilter(keyword, moduleName, actionType, severity, status, actorRole, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(auditLogService.searchLogs(filter, page, size)));
    }

    @GetMapping("/stats")
    @Operation(summary = "Thống kê tổng hợp nhật ký hệ thống")
    public ResponseEntity<ApiResponse<AuditLogStatsDTO>> getAuditStats() {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAuditStats()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một bản ghi nhật ký kèm JSON diff")
    public ResponseEntity<ApiResponse<AuditLogResponseDTO>> getAuditLogById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getLogById(id)));
    }

    @GetMapping("/export")
    @Operation(summary = "Xuất nhật ký hệ thống ra tệp CSV/Excel UTF-8")
    public ResponseEntity<byte[]> exportAuditLogsCsv(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String moduleName,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String actorRole,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        AuditLogFilterDTO filter = buildFilter(keyword, moduleName, actionType, severity, status, actorRole, fromDate, toDate);
        byte[] csvBytes = auditLogService.exportLogsToCsv(filter);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"thesishub_audit_logs.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvBytes);
    }

    private AuditLogFilterDTO buildFilter(
            String keyword,
            String moduleName,
            String actionType,
            String severity,
            String status,
            String actorRole,
            LocalDate fromDate,
            LocalDate toDate) {
        ZoneId zone = ZoneId.systemDefault();
        Instant fromInstant = fromDate != null ? fromDate.atStartOfDay(zone).toInstant() : null;
        Instant toInstant = toDate != null ? toDate.plusDays(1).atStartOfDay(zone).minusNanos(1).toInstant() : null;

        return AuditLogFilterDTO.builder()
                .keyword(keyword)
                .moduleName(moduleName)
                .actionType(actionType)
                .severity(severity)
                .status(status)
                .actorRole(actorRole)
                .fromDate(fromInstant)
                .toDate(toInstant)
                .build();
    }
}
