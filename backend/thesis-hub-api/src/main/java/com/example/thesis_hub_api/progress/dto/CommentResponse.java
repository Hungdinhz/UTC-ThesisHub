package com.example.thesis_hub_api.progress.dto;

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
public class CommentResponse {
    private Long id;
    private Long taskId;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Long parentId;
    private String content;
    private String attachmentUrl;
    private Boolean isEdited;
    private List<CommentResponse> replies;
    private Instant createdAt;
    private Instant updatedAt;
}
