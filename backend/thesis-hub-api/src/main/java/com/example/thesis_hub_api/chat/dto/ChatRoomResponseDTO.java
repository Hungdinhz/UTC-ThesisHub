package com.example.thesis_hub_api.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponseDTO {
    private String roomKey;
    private Long projectRoundId;
    private String roundCode;
    private String roundName;
    private String roundStatus;
    private Long lecturerId;
    private String lecturerName;
    private String lecturerDegree;
    private Integer studentCount;
    private List<ChatRoomMemberDTO> members;
    private String lastMessagePreview;
    private String lastSenderName;
    private Instant lastMessageAt;
    private Long totalMessages;
}
