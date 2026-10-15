package com.example.thesis_hub_api.progress.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponseDTO {
    private Long id;
    private Long taskId;
    private Long submissionId;
    private Long authorId;
    private String authorName;
    private String content;
    private Instant createdAt;
}
