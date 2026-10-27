package com.example.thesis_hub_api.notification;

import com.example.thesis_hub_api.common.exception.UnauthorizedException;
import com.example.thesis_hub_api.common.pagination.PageResponse;
import com.example.thesis_hub_api.notification.dto.NotificationResponseDTO;
import com.example.thesis_hub_api.notification.entity.Notification;
import com.example.thesis_hub_api.notification.repository.NotificationRepository;
import com.example.thesis_hub_api.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void testCreateNotification_Success() {
        Notification savedNotification = Notification.builder()
                .id(1L)
                .userId(100L)
                .title("Thông báo mới")
                .content("Bạn đã được phân công GVHD")
                .type("ASSIGNMENT")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        NotificationResponseDTO result = notificationService.createNotification(
                100L, "Thông báo mới", "Bạn đã được phân công GVHD", "ASSIGNMENT", null
        );

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("ASSIGNMENT", result.getType());
        assertFalse(result.getIsRead());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void testGetUserNotifications_Success() {
        Notification n = Notification.builder()
                .id(1L)
                .userId(100L)
                .title("Test")
                .content("Content")
                .type("SYSTEM")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(100L), any()))
                .thenReturn(new PageImpl<>(List.of(n), PageRequest.of(0, 10), 1));

        PageResponse<NotificationResponseDTO> response = notificationService.getUserNotifications(100L, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
    }

    @Test
    void testMarkAsRead_Success() {
        Notification n = Notification.builder()
                .id(1L)
                .userId(100L)
                .title("Test")
                .content("Content")
                .isRead(false)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponseDTO dto = notificationService.markAsRead(1L, 100L);

        assertTrue(dto.getIsRead());
        verify(notificationRepository).save(n);
    }

    @Test
    void testMarkAsRead_WrongUser_ThrowsUnauthorized() {
        Notification n = Notification.builder()
                .id(1L)
                .userId(100L)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));

        assertThrows(UnauthorizedException.class, () -> notificationService.markAsRead(1L, 999L));
    }

    @Test
    void testDeleteNotification_Success() {
        Notification n = Notification.builder()
                .id(1L)
                .userId(100L)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));

        assertDoesNotThrow(() -> notificationService.deleteNotification(1L, 100L));
        verify(notificationRepository).delete(n);
    }

    @Test
    void testDeleteNotification_WrongUser_ThrowsUnauthorized() {
        Notification n = Notification.builder()
                .id(1L)
                .userId(100L)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));

        assertThrows(UnauthorizedException.class, () -> notificationService.deleteNotification(1L, 999L));
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    void testMarkMultipleAsRead_Success() {
        Notification n1 = Notification.builder().id(1L).userId(100L).isRead(false).build();
        Notification n2 = Notification.builder().id(2L).userId(100L).isRead(false).build();

        when(notificationRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(n1, n2));

        int updated = notificationService.markMultipleAsRead(List.of(1L, 2L), 100L);

        assertEquals(2, updated);
        assertTrue(n1.getIsRead());
        assertTrue(n2.getIsRead());
        verify(notificationRepository).saveAll(any());
    }
}
