package com.example.thesis_hub_api.notification.controller;

import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.notification.dto.NotificationResponseDTO;
import com.example.thesis_hub_api.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "API quản lý thông báo người dùng hệ thống")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo của người dùng")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponseDTO>>> getUserNotifications(
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<NotificationResponseDTO> result = notificationService.getUserNotifications(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestParam(required = false, defaultValue = "1") Long userId
    ) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    public ResponseEntity<ApiResponse<NotificationResponseDTO>> markAsRead(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long userId
    ) {
        NotificationResponseDTO result = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc", result));
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "Đánh dấu tất cả thông báo của người dùng là đã đọc")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(
            @RequestParam(required = false, defaultValue = "1") Long userId
    ) {
        int updatedCount = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", updatedCount));
    }
}
