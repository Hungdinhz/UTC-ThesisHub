package com.example.thesis_hub_api.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponseDTO {
    private Long id;
    private Long projectRoundId;
    private Long lecturerId;
    private Long senderUserId;
    private String senderName;
    private String senderRole;
    private String content;
    private String attachmentUrl;
    private String attachmentName;
    private Instant createdAt;
    private Boolean isMine;
}
