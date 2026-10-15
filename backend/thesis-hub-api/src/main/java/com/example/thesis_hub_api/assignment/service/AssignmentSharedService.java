package com.example.thesis_hub_api.assignment.service;

import com.example.thesis_hub_api.assignment.dto.AssignmentExportDto;
import java.util.List;

public interface AssignmentSharedService {
    /**
     * Lấy danh sách kết quả phân công ĐÃ CHỐT (FINAL) cho đợt đồ án.
     * API này được cung cấp cho module Thesis (Quyết) và module Defense (Khoa) sử dụng.
     *
     * @param projectRoundId ID của đợt đồ án
     * @return Danh sách DTO xuất ra các module khác
     */
    List<AssignmentExportDto> getFinalizedAssignments(Integer projectRoundId);
    
    /**
     * Lấy thông tin GVHD của một sinh viên cụ thể trong một đợt.
     */
    AssignmentExportDto getAssignmentForStudent(Integer studentId, Integer projectRoundId);
}
