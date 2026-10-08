package com.example.thesis_hub_api.notification.service;

import com.example.thesis_hub_api.common.exception.ResourceNotFoundException;
import com.example.thesis_hub_api.common.exception.UnauthorizedException;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.notification.dto.NotificationResponseDTO;
import com.example.thesis_hub_api.notification.entity.Notification;
import com.example.thesis_hub_api.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public NotificationResponseDTO createNotification(Long userId, String title, String content, String type, String referenceUrl) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .type(type != null ? type : "SYSTEM")
                .referenceUrl(referenceUrl)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification for userId={}: {}", userId, title);
        return NotificationResponseDTO.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponseDTO> getUserNotifications(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<NotificationResponseDTO> dtos = page.getContent().stream()
                .map(NotificationResponseDTO::from)
                .toList();
        return PageResponse.from(page, dtos);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId, Long currentUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo", notificationId));

        if (!notification.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("Bạn không có quyền đánh dấu thông báo này");
        }

        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        return NotificationResponseDTO.from(updated);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }
}
