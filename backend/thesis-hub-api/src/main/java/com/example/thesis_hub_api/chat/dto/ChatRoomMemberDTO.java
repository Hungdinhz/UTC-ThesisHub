package com.example.thesis_hub_api.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomMemberDTO {
    private Long userId;
    private Long profileId;
    private String fullName;
    private String code;
    private String className;
    private String role; // SUPERVISOR, STUDENT
}
