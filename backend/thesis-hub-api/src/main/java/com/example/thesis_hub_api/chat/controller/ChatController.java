package com.example.thesis_hub_api.chat.controller;

import com.example.thesis_hub_api.chat.dto.ChatMessageResponseDTO;
import com.example.thesis_hub_api.chat.dto.ChatRoomResponseDTO;
import com.example.thesis_hub_api.chat.dto.SendChatMessageRequestDTO;
import com.example.thesis_hub_api.chat.service.ChatService;
import com.example.thesis_hub_api.common.response.ApiResponse;
import com.example.thesis_hub_api.identity.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal.getId();
        }
        return null;
    }

    @GetMapping("/rooms")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'COMMITTEE')")
    public ResponseEntity<ApiResponse<List<ChatRoomResponseDTO>>> getMyRooms() {
        List<ChatRoomResponseDTO> rooms = chatService.getMyRooms(currentUserId());
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/rooms/{roundId}/{lecturerId}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'COMMITTEE')")
    public ResponseEntity<ApiResponse<List<ChatMessageResponseDTO>>> getRoomMessages(
            @PathVariable Long roundId,
            @PathVariable Long lecturerId) {
        List<ChatMessageResponseDTO> messages = chatService.getRoomMessages(roundId, lecturerId, currentUserId());
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/rooms/{roundId}/{lecturerId}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'LECTURER', 'COMMITTEE')")
    public ResponseEntity<ApiResponse<ChatMessageResponseDTO>> sendMessage(
            @PathVariable Long roundId,
            @PathVariable Long lecturerId,
            @RequestBody SendChatMessageRequestDTO request) {
        ChatMessageResponseDTO sent = chatService.sendMessage(roundId, lecturerId, currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi tin nhắn", sent));
    }
}
