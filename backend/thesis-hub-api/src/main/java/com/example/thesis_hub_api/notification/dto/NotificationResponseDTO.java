package com.example.thesis_hub_api.notification.dto;

import com.example.thesis_hub_api.notification.entity.Notification;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String type;
    private String referenceUrl;
    private Boolean isRead;
    private Instant createdAt;

    public static NotificationResponseDTO from(Notification notification) {
        return NotificationResponseDTO.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .referenceUrl(notification.getReferenceUrl())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    // Aliases to seamlessly support frontend legacy expectations
    @JsonProperty("message")
    public String getMessage() {
        return content;
    }

    @JsonProperty("notification_type")
    public String getNotificationType() {
        return type;
    }

    @JsonProperty("action_url")
    public String getActionUrl() {
        return referenceUrl;
    }

    @JsonProperty("is_read")
    public Boolean getIsReadSnake() {
        return isRead;
    }

    @JsonProperty("created_at")
    public Instant getCreatedAtSnake() {
        return createdAt;
    }
}
