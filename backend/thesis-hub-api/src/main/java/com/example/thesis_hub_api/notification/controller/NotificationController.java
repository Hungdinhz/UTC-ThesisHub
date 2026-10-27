package com.example.thesis_hub_api.notification.controller;

import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import com.example.thesis_hub_api.notification.dto.MarkReadRequestDTO;
import com.example.thesis_hub_api.notification.dto.NotificationResponseDTO;
import com.example.thesis_hub_api.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "API quản lý thông báo người dùng hệ thống")
public class NotificationController {

    private final NotificationService notificationService;

    private Long resolveUserId(UserPrincipal userPrincipal, Long fallbackUserId) {
        if (userPrincipal != null && userPrincipal.getId() != null) {
            return userPrincipal.getId();
        }
        return fallbackUserId != null ? fallbackUserId : 1L;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo của người dùng")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponseDTO>>> getUserNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<NotificationResponseDTO> result = notificationService.getUserNotifications(targetUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        long count = notificationService.getUnreadCount(targetUserId);
        Map<String, Object> data = new HashMap<>();
        data.put("unread_count", count);
        data.put("unreadCount", count);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    public ResponseEntity<ApiResponse<NotificationResponseDTO>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        NotificationResponseDTO result = notificationService.markAsRead(id, targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc", result));
    }

    @PostMapping("/mark-read")
    @Operation(summary = "Đánh dấu thông báo đã đọc theo danh sách hoặc tất cả")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAsReadBatch(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId,
            @RequestBody(required = false) MarkReadRequestDTO request
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        int updatedCount = (request != null && request.getNotificationIds() != null && !request.getNotificationIds().isEmpty())
                ? notificationService.markMultipleAsRead(request.getNotificationIds(), targetUserId)
                : notificationService.markAllAsRead(targetUserId);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Đã đánh dấu thông báo là đã đọc");
        result.put("updated_count", updatedCount);
        result.put("updatedCount", updatedCount);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc", result));
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "Đánh dấu tất cả thông báo của người dùng là đã đọc")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        int updatedCount = notificationService.markAllAsRead(targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", updatedCount));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá một thông báo")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        notificationService.deleteNotification(id, targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá thông báo thành công", null));
    }

    @DeleteMapping("/delete-all")
    @Operation(summary = "Xoá tất cả thông báo của người dùng")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteAllNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Long userId
    ) {
        Long targetUserId = resolveUserId(userPrincipal, userId);
        int deletedCount = notificationService.deleteAllNotifications(targetUserId);
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Đã xoá tất cả thông báo");
        result.put("deleted_count", deletedCount);
        result.put("deletedCount", deletedCount);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá tất cả thông báo", result));
    }
}
