package com.example.thesis_hub_api.identity.controller;

import com.example.thesis_hub_api.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Frontend Compatibility", description = "Các API tương thích ngược cho giao diện sinh viên, giảng viên và hội đồng")
public class FrontendCompatibilityController {

    @GetMapping("/projects/categories")
    @Operation(summary = "Lấy danh mục hướng đề tài tốt nghiệp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProjectCategories() {
        List<Map<String, Object>> categories = List.of(
                Map.of("id", 1, "category_name", "Công nghệ phần mềm & Hệ thống thông tin"),
                Map.of("id", 2, "category_name", "Trí tuệ nhân tạo & Khoa học dữ liệu"),
                Map.of("id", 3, "category_name", "Mạng máy tính & An toàn thông tin")
        );
        Map<String, Object> data = new HashMap<>();
        data.put("results", categories);
        data.put("count", categories.size());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/groups/requests")
    @Operation(summary = "Lấy danh sách yêu cầu ghép nhóm sinh viên")
    public ResponseEntity<ApiResponse<List<Object>>> getGroupRequests(
            @RequestParam(required = false) String requested,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
    }

    @GetMapping("/supervisor-student/requests")
    @Operation(summary = "Lấy danh sách yêu cầu hướng dẫn đồ án")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupervisorStudentRequests(
            @RequestParam(required = false) String requested) {
        Map<String, Object> data = new HashMap<>();
        data.put("results", Collections.emptyList());
        data.put("count", 0);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/supervisors/analytics")
    @Operation(summary = "Thống kê tổng quan dành cho Giảng viên hướng dẫn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupervisorAnalytics() {
        Map<String, Object> groups = Map.of("total", 0, "pending", 0, "accepted", 0, "rejected", 0);
        Map<String, Object> evalStat = Map.of("submitted", 0, "evaluated", 0);
        Map<String, Object> evaluations = Map.of(
                "scope_document", evalStat,
                "srs_supervisor", evalStat,
                "sdd_supervisor", evalStat,
                "evaluation3_supervisor", evalStat,
                "evaluation4_supervisor", evalStat
        );
        Map<String, Object> avgMarks = Map.of(
                "srs_supervisor", 0.0,
                "sdd_supervisor", 0.0,
                "evaluation3_supervisor", 0.0,
                "evaluation4_supervisor", 0.0
        );

        Map<String, Object> data = new HashMap<>();
        data.put("groups", groups);
        data.put("evaluations", evaluations);
        data.put("average_marks", avgMarks);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/committee-members/analytics")
    @Operation(summary = "Thống kê tổng quan dành cho Thành viên hội đồng")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCommitteeMemberAnalytics() {
        Map<String, Object> panel = Map.of(
                "id", 1,
                "name", "Hội đồng chấm bảo vệ UTC",
                "total_members", 5,
                "members", Collections.emptyList()
        );
        Map<String, Object> groups = Map.of("total", 0, "groups_per_member", 0);
        Map<String, Object> evalStat = Map.of("submitted", 0, "evaluated", 0);
        Map<String, Object> evaluations = Map.of(
                "srs_committee", evalStat,
                "sdd_committee", evalStat,
                "evaluation3_committee", evalStat,
                "evaluation4_committee", evalStat
        );

        Map<String, Object> data = new HashMap<>();
        data.put("panel", panel);
        data.put("groups", groups);
        data.put("evaluations", evaluations);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/supervisors/documents")
    @Operation(summary = "Lấy tài liệu phân công giảng viên")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupervisorDocuments() {
        Map<String, Object> data = new HashMap<>();
        data.put("results", Collections.emptyList());
        data.put("count", 0);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}