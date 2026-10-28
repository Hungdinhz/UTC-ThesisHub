package com.example.thesis_hub_api.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendChatMessageRequestDTO {
    private String content;
    private String attachmentUrl;
    private String attachmentName;
}
